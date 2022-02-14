const getDate = date => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return { year, month, day };
};

const getTime = date => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return { hour, minute, second };
};

const getDateTime = sourceDate => ({
    ...getDate(sourceDate),
    ...getTime(sourceDate)
});

module.exports = {
    getDate,
    getTime,
    getDateTime
};
