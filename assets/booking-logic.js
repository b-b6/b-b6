/**
 * Единая логика сетки слотов (шаг 30 мин) и проверки пересечений с renderTimes на index.html.
 */
(function BookingLogic(global) {
    const STEP_MIN = 30;

    function padTime(openTime, closeTime) {
        const ot = openTime && openTime.length >= 5 ? openTime.substring(0, 5) : '10:00';
        const ct = closeTime && closeTime.length >= 5 ? closeTime.substring(0, 5) : '21:00';
        return [ot, ct];
    }

    function buildRawAvailableTimes(openTime, closeTime) {
        const [ot, ct] = padTime(openTime, closeTime);
        const rawAvailableTimes = [];
        let tObj = new Date(`2000-01-01T${ot}:00`);
        let eObj = new Date(`2000-01-01T${ct}:00`);
        while (tObj < eObj) {
            rawAvailableTimes.push(tObj.toTimeString().substring(0, 5));
            tObj.setMinutes(tObj.getMinutes() + STEP_MIN);
        }
        return rawAvailableTimes;
    }

    function serviceDuration(serviceKey, allServices) {
        const bSrv = allServices.find(s => s.id === serviceKey);
        return bSrv && bSrv.duration ? bSrv.duration : 60;
    }

    /**
     * Карта занятости по дате (как в index renderTimes).
     */
    function buildBookedMapForDate(existingBookings, date, rawAvailableTimes, allServices) {
        const bookedMap = {};
        existingBookings
            .filter(b => b.status !== 'cancelled' && b.date === date)
            .forEach(b => {
                let sDur = serviceDuration(b.serviceKey, allServices);
                if (!b.serviceKey && b.service) {
                    const byTitle = allServices.find(s => s.strings && s.strings.ru && s.strings.ru.title === b.service);
                    if (byTitle && byTitle.duration) sDur = byTitle.duration;
                }
                const bSlots = Math.max(1, sDur / STEP_MIN);
                const tIdx = rawAvailableTimes.indexOf(b.time);
                if (tIdx === -1) return;
                for (let k = 0; k < bSlots; k++) {
                    if (tIdx + k < rawAvailableTimes.length) {
                        const bkTime = rawAvailableTimes[tIdx + k];
                        if (!bookedMap[bkTime]) bookedMap[bkTime] = [];
                        bookedMap[bkTime].push(b.masterId);
                    }
                }
            });
        return bookedMap;
    }

    /**
     * true = слот с этой стартовой меткой занят (как disabled в UI).
     */
    function slotIntervalBlocked(bookedMap, rawAvailableTimes, timeStart, masterId, numMasters, durMinutes) {
        const blocksNeeded = Math.max(1, durMinutes / STEP_MIN);
        const index = rawAvailableTimes.indexOf(timeStart);
        if (index === -1 || index + blocksNeeded > rawAvailableTimes.length) return true;

        for (let k = 0; k < blocksNeeded; k++) {
            const checkTime = rawAvailableTimes[index + k];
            const slotsBooked = bookedMap[checkTime] || [];
            if (masterId === 'any') {
                if (slotsBooked.length >= numMasters || slotsBooked.includes('any')) return true;
            } else {
                if (slotsBooked.includes(masterId) || slotsBooked.includes('any')) return true;
            }
        }
        return false;
    }

    /**
     * @param {Array} existingItems — все записи (в т.ч. cancelled — отфильтруем)
     * @param {object} candidate — { date, time, masterId, serviceKey }
     * @param {object} ctx — { masters, services, settings }
     * @returns {string|null} — null если ок, иначе код ошибки
     */
    function validateNewBooking(existingItems, candidate, ctx) {
        const masters = ctx.masters || [];
        const services = ctx.services || [];
        const settings = ctx.settings || { openTime: '10:00', closeTime: '21:00' };

        if (!candidate || !candidate.date || !candidate.time || !candidate.masterId) {
            return 'INVALID_BOOKING_PAYLOAD';
        }

        const dur = serviceDuration(candidate.serviceKey, services);
        const rawAvailableTimes = buildRawAvailableTimes(settings.openTime, settings.closeTime);
        const existing = existingItems.filter(b => b.status !== 'cancelled');
        const bookedMap = buildBookedMapForDate(existing, candidate.date, rawAvailableTimes, services);
        const numMasters = Math.max(1, masters.length);

        if (slotIntervalBlocked(bookedMap, rawAvailableTimes, candidate.time, candidate.masterId, numMasters, dur)) {
            return 'SLOT_TAKEN';
        }
        return null;
    }

    global.BookingLogic = {
        STEP_MIN,
        buildRawAvailableTimes,
        buildBookedMapForDate,
        slotIntervalBlocked,
        validateNewBooking,
        serviceDuration
    };
})(typeof window !== 'undefined' ? window : globalThis);
