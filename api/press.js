export default async function handler(req, res) {
    return res.status(200).json({
        method: req.method,
        message: "NEW VERSION"
    });
}