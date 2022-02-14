export const getPage = () => {
    const pages = getCurrentPages();
    const currentPage = pages[ pages.length - 1 ];
    return currentPage;
};
