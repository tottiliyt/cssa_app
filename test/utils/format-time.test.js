const {
    padLeftWithZero,
    formatDate,
    formatTime,
    formatDateTime
} = require("../../utils/format-time.js");

describe("padLeftWithZero", () => {
    it("should pad single-digit integer to two digits", () => {
        const singleDigitNumber = 0;
        const result = padLeftWithZero(singleDigitNumber);
        expect(result).toEqual("00");
    });

    it("should not change two-digit integers", () => {
        const twoDigitNumber = 12;
        const result = padLeftWithZero(twoDigitNumber);
        expect(result).toEqual("12");
    });
});

describe("date time formatters", () => {
    let year;
    let month;
    let day;
    let hour;
    let minute;
    let second;

    beforeEach(() => {
        [year, month, day, hour, minute, second] = [1970, 1, 1, 1, 1, 1];
    });

    describe("formatDate", () => {
        it("should format date with slash separator and padding", () => {
            const formattedDate = formatDate({ year, month, day });
            expect(formattedDate).toBe("1970/01/01");
        });
    });

    describe("formatTime", () => {
        it("should format time with colon separator and padding", () => {
            const formattedTime = formatTime({ hour, minute, second });
            expect(formattedTime).toBe("01:01:01");
        });
    });

    describe("formatDateTime", () => {
        it("should format date and time separated by space", () => {
            const formattedDateTime = formatDateTime({
                year,
                month,
                day,
                hour,
                minute,
                second
            });

            expect(formattedDateTime).toBe("1970/01/01 01:01:01");
        });
    });
});
