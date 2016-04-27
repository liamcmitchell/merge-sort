const valRange = 100
const margin = 40
const sortTime = 100

// Build list and steps we want to animate.
const list = []
for (var i = 0; i < 32; i++) {
  list.push({
    id: i,
    val: Math.floor(Math.random() * valRange)
  })
}
const steps = buildMergeSteps(1, list)

const startTime = Date.now()
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// Keep updated dimensions to draw to.
const dimensions = {width: 300, height: 300}
function updateDimensions() {
  dimensions.width = canvas.width = document.body.clientWidth
  dimensions.height = canvas.height = document.body.clientHeight
}
window.addEventListener('load', updateDimensions)
window.addEventListener('resize', updateDimensions)

function tick() {
  window.requestAnimationFrame(tick)
  render(Date.now() - startTime)
}

function render(time) {
  const step = steps.find(s => stepStart(s) <= time && stepEnd(s) > time)

  const xUnit = (dimensions.width - margin * 2) / list.length
  const yUnit = (dimensions.height - margin * 2) / valRange

  if (!step) {
    return
  }

  // Clear
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, dimensions.width, dimensions.height)

  // Rectangles for merge, left & right.
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 2
  ctx.strokeRect(
    // x
    step.leftIndex * xUnit + margin,
    // y
    margin,
    // width
    step.sorted * xUnit,
    // height
    dimensions.height - margin * 2
  )

  step.after.forEach((v) => {
    ctx.fillStyle = step.left.includes(v) ?
      'green' :
      step.right.includes(v) ?
        'blue' :
        'black'
    ctx.beginPath()

    const indexBefore = step.before.indexOf(v)
    const indexAfter = step.after.indexOf(v)
    const animationStart = stepStart(step) + step.sectionAfter.indexOf(v) * sortTime
    const animatedIndex = indexBefore === indexAfter ?
      indexBefore :
      indexBefore + (indexAfter - indexBefore) * easeInOut(Math.min(1, Math.max(0, ((time - animationStart) / sortTime))))
    ctx.arc(
      // x
      margin + (animatedIndex * xUnit) + (xUnit / 2),
      // y
      margin + ((valRange - 1 - v.val) * yUnit) + (yUnit / 2),
      // radius
      5,
      // startAngle
      0,
      // endAngle
      6.5
    )
    ctx.fill()
  })
}

function easeInOut(t) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function stepStart(s) {
  return (s.totalSorted - s.sorted) * sortTime
}

function stepEnd(s) {
  return s.totalSorted * sortTime
}

// Build an array of all the steps between merges in a mergeSort.
function buildMergeSteps(n, list) {
  const tracker = {
    original: list,
    stepsLeft: n,
    totalSorted: 0
  }
  const l = mergeSort(tracker, list)
  if (tracker.stepsLeft > 0) {
    // This step wasn't needed.
    return []
  }
  else {
    tracker.after = l
    tracker.leftIndex = l.indexOf(tracker.sectionAfter[0])
    tracker.rightIndex = tracker.leftIndex + tracker.left.length
    tracker.endIndex = tracker.rightIndex + tracker.right.length
    tracker.before = [].concat(l.slice(0, tracker.leftIndex), tracker.sectionBefore, l.slice(tracker.endIndex))
    // Add on the next step.
    return [tracker].concat(buildMergeSteps(n + 1, list))
  }
}

// Emulate mergeSort and add info to tracker about specific step.
function mergeSort(tracker, list) {
  if (list.length <= 1) {
    return list
  }
  else {
    return merge(tracker,
      mergeSort(tracker, list.slice(0, Math.round(list.length / 2))),
      mergeSort(tracker, list.slice(Math.round(list.length / 2)))
    )
  }
}

function merge(tracker, left, right) {
  const merged = left.concat(right)
  if (tracker.stepsLeft) {
    const sorted = merged.slice().sort((a, b) => a.val - b.val)
    tracker.stepsLeft--
    tracker.totalSorted += merged.length
    if (tracker.stepsLeft === 0) {
      // This is the step we care about.
      tracker.left = left
      tracker.right = right
      tracker.sectionBefore = merged
      tracker.sectionAfter = sorted
      tracker.sorted = sorted.length
    }
    return sorted
  }
  else {
    return merged
  }
}

tick()
