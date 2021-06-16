const PARAMS = {
    "D": {
        "fmt": "YYYY-MM-DD",
        "offsetFmt": "D"
    },
    "W": {
        "fmt": "gggg-[W]ww",
        "offsetFmt": "W"
    },
    "M": {
        "fmt": "YYYY-MM",
        "offsetFmt": "M"
    },
}

function generate_periodic_link_markdown(tp, periodicityKey) {
    const fmt = PARAMS[periodicityKey]["fmt"]
    const offsetFmt = PARAMS[periodicityKey]["offsetFmt"]

    const offsetPast = `P-1${offsetFmt}`
    const offsetFuture = `P1${offsetFmt}`

    const now = tp.date.now(fmt, 0, tp.file.title, fmt)
    const past = tp.date.now(fmt, offsetPast, now, fmt)
    const future = tp.date.now(fmt, offsetFuture, now, fmt)

    str = `<< [[${past}|Yesterday]] | [[${future}|Tomorrow]] >>`

    return str
}

module.exports = generate_periodic_link_markdown;