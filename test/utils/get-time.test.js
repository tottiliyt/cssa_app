const { getDate, getTime, getDateTime } = require("../../utils/get-time.js");

const timeSinceEpoch = 0;
const date = new Date(timeSinceEpoch);

describe("getDate", () => {
    const expectedYear = date.getFullYear();
    // Month starts at 0 because some calendars have 13 months.
    const expectedMonth = date.getMonth() + 1;
    const expectedDay = date.getDate();

    it("should extract correct date", () => {
        expect(getDate(date)).toEqual({
            year: expectedYear,
            month: expectedMonth,
            day: expectedDay
        });
    });
});

describe("getTime", () => {
    const expectedHour = date.getHours();
    const expectedMinute = date.getMinutes();
    const expectedSecond = date.getSeconds();

    it("should extract correct time", () => {
        expect(getTime(date)).toEqual({
            hour: expectedHour,
            minute: expectedMinute,
            second: expectedSecond
        });
    });
});

describe("getDateTime", () => {
    const expectedYear = date.getFullYear();
    const expectedMonth = date.getMonth() + 1;
    const expectedDay = date.getDate();
    const expectedHour = date.getHours();
    const expectedMinute = date.getMinutes();
    const expectedSecond = date.getSeconds();

    it("should extract correct date and time", () => {
        expect(getDateTime(date)).toEqual({
            year: expectedYear,
            month: expectedMonth,
            day: expectedDay,
            hour: expectedHour,
            minute: expectedMinute,
            second: expectedSecond
        });
    });
});
