

module.exports = async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const today = new Date().toDateString();

    console.log(`ip: ${ip}, userAgent: ${userAgent}, date: ${today}`);
    
    next();
}
