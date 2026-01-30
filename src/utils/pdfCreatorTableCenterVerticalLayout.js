exports.centeredLayout = (layoutPropertiesToOverride = {}) => {
    return {
        paddingTop: function (index, node) {
            applyVerticalAlignment(node, index, 'center', []);
            return 0;
        },
        ...layoutPropertiesToOverride
    }
}

exports.applyVerticalAlignmentToCell = (index, node) => {
    applyVerticalAlignment(node, index, 'center', []);
}

function findInlineHeight(cell, maxWidth, usedWidth = 0) {
    if (cell._margin) {
        maxWidth = maxWidth - cell._margin[0] - cell._margin[2]
    }
    let calcLines = (inlines) => {
        if (!inlines) {
            return {
                height: 0,
                width: 0
            }
        }
        let currentMaxHeight = 0
        let lastHadLineEnd = false
        for (const currentNode of inlines) {
            usedWidth += currentNode.width
            if (usedWidth > maxWidth || lastHadLineEnd) {
                currentMaxHeight += currentNode.height
                usedWidth = currentNode.width
            } else {
                currentMaxHeight = Math.max(currentNode.height, currentMaxHeight)
            }
            lastHadLineEnd = !!currentNode.lineEnd
        }
        return fillMargin({
            height: currentMaxHeight,
            width: usedWidth
        }, cell._margin)
    }
    if (cell._offsets) {
        usedWidth += cell._offsets.total
    }
    if (cell._inlines && cell._inlines.length) {
        return calcLines(cell._inlines)
    } else if (cell.stack && cell.stack[0]) {
        return fillMargin(cell.stack.map(item => {
            return findInlineHeight(item, maxWidth)
        }).reduce((prev, next) => {
            return {
                height: prev.height + next.height,
                width: Math.max(prev.width + next.width)
            }
        }), cell._margin)
    } else if (cell.ul) {
        return fillMargin(cell.ul.map(item => {
            return findInlineHeight(item, maxWidth)
        }).reduce((prev, next) => {
            return {
                height: prev.height + next.height,
                width: Math.max(prev.width + next.width)
            }
        }), cell._margin)
    } else if (cell.table) {
        let currentMaxHeight = 0
        for (const currentTableBodies of cell.table.body) {
            const innerTableHeights = currentTableBodies.map((val) => mapTableBodies(val, maxWidth, usedWidth))
            currentMaxHeight = Math.max(...innerTableHeights, currentMaxHeight)
        }
        return fillMargin({
            height: currentMaxHeight,
            width: usedWidth
        }, cell._margin)
    } else if (cell._height) {
        usedWidth += cell._width
        return fillMargin({
            height: cell._height,
            width: usedWidth
        }, cell._margin)
    }

    return fillMargin({
        height: null,
        width: usedWidth
    }, cell._margin)
}

function mapTableBodies(innerTableCell, maxWidth, usedWidth) {
    const inlineHeight = findInlineHeight(
        innerTableCell,
        maxWidth,
        usedWidth
    );

    usedWidth = inlineHeight.width;
    return inlineHeight.height;
}

function fillMargin(obj, margin) {
    if (margin) {
        obj.height += (margin[1] + margin[3])
        obj.width += (margin[0] + margin[2])
    }
    return obj
}
function updateRowSpanCell(rowHeight, rowSpanCell) {
    for (let i = rowSpanCell.length - 1; i >= 0; i--) {
        const rowCell = rowSpanCell[i]
        rowCell.maxHeight = rowCell.maxHeight + rowHeight
        const {
            maxHeight,
            cellHeight,
            align,
            cell
        } = rowCell
        rowCell.rowSpanCount = rowCell.rowSpanCount - 1
        if (!rowCell.rowSpanCount) {
            if (cellHeight && maxHeight > cellHeight) {
                let topMargin

                let cellAlign = align
                if (Array.isArray(align)) {
                    cellAlign = align
                }
                if (cellAlign === 'bottom') {
                    topMargin = maxHeight - cellHeight
                } else if (cellAlign === 'center') {
                    topMargin = (maxHeight - cellHeight) / 2
                }
                if (topMargin) {
                    if (cell._margin) {
                        cell._margin[1] = cell._margin[1] + topMargin
                    } else {
                        cell._margin = [0, topMargin, 0, 0]
                    }
                }
            }
            rowSpanCell.splice(i, 1)
        }
    }
}

function applyVerticalAlignment(node, rowIndex, align, rowSpanCell, manualHeight = 0) { // New default argument
    const allCellHeights = node.table.body[rowIndex].map(
        (innerNode, columnIndex) => {
            if (innerNode._span) return null
            const calcWidth = [...Array(innerNode.colSpan || 1).keys()].reduce((acc, i) => {
                return acc + node.table.widths[columnIndex + i]._calcWidth
            }, 0)
            const mFindInlineHeight = findInlineHeight(innerNode, calcWidth, 0, rowIndex, columnIndex)
            return mFindInlineHeight.height
        }
    )
    let maxRowHeight = manualHeight ? manualHeight[rowIndex] : Math.max(...allCellHeights) // handle manual height
    node.table.body[rowIndex].forEach((cell, ci) => {
        // rowSpan
        if (cell.rowSpan) {
            rowSpanCell.push({
                cell,
                rowSpanCount: cell.rowSpan,
                cellHeight: allCellHeights[ci],
                maxHeight: 0,
                align
            })
            return
        }
        if (allCellHeights[ci] && maxRowHeight > allCellHeights[ci]) {
            let topMargin

            let cellAlign = align
            if (Array.isArray(align)) {
                cellAlign = align[ci]
            }
            if (cellAlign === 'bottom') {
                topMargin = maxRowHeight - allCellHeights[ci]
            } else if (cellAlign === 'center') {
                topMargin = (maxRowHeight - allCellHeights[ci]) / 2
            }
            if (topMargin) {
                if (cell._margin) {
                    cell._margin[1] += topMargin
                } else {
                    cell._margin = [0, topMargin, 0, 0]
                }
            }
        }
    })
    updateRowSpanCell(maxRowHeight, rowSpanCell)
    if (rowSpanCell.length > 0) {
        applyVerticalAlignment(node, rowIndex + 1, align, rowSpanCell, manualHeight)
    }
}