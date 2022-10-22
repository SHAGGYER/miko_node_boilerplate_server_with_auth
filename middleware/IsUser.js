exports.IsUser = (req, res, next) => {
    if (!res.locals.userId) {
        return res.status(403).send({error: "Ikke logget ind"})
    }

    next()
}