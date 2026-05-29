const STEPS = ['Posted', 'Accepted', 'Picked Up', 'Delivered']

const StatusStepper = ({ status }) => {
  const idx = ['posted','accepted','picked_up','delivered'].indexOf(status)

  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className={`step-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <div className={`step-label ${i <= idx ? (i === idx ? 'active' : 'done') : ''}`}>
              {label}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-connector ${i < idx ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default StatusStepper