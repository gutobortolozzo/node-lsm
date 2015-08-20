
function compare (a, b) {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

exports.compare = compare
