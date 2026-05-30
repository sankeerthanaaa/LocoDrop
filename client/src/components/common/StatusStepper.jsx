const STEPS = ['Posted', 'Accepted', 'Picked Up', 'Delivered']

const StatusStepper = ({ status }) => {
  const idx = ['posted','accepted','picked_up','delivered'].indexOf(status)

  return (
    <div className="status-stepper">
      {STEPS.map((label, i) => {
        const isDone = i < idx
        const isActive = i === idx
        const stepClass = `step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`
        return (
          <div key={label} className={stepClass}>
            <div className="step-dot">
              {isDone ? '✓' : i + 1}
            </div>
            <div className="step-label">
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatusStepper