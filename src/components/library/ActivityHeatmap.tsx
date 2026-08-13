import { useEffect, useMemo, useState } from 'react'
import {
  activityLevel,
  flushPlaySession,
  hoursForDay,
  loadDayMinutes,
  type DayMinutesMap,
} from '../../lib/playActivity'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const LEGEND: { label: string; level: 0 | 1 | 2 | 3 }[] = [
  { label: '0h', level: 0 },
  { label: '> 2h', level: 1 },
  { label: '> 4h', level: 2 },
  { label: '> 8h', level: 3 },
]

interface ActivityHeatmapProps {
  userId: string
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long' })
}

function buildMonthOptions(now = new Date(), count = 6) {
  const options: { year: number; month: number; key: string; label: string }[] = []
  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    options.push({
      year,
      month,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: monthLabel(year, month),
    })
  }
  return options
}

function buildCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const mondayOffset = (firstDow + 6) % 7
  const cells: ({ day: number; key: string } | null)[] = []

  for (let i = 0; i < mondayOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, key })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (({ day: number; key: string } | null)[])[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const monthOptions = useMemo(() => buildMonthOptions(), [])
  const [selectedKey, setSelectedKey] = useState(monthOptions[0]?.key ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dayMinutes, setDayMinutes] = useState<DayMinutesMap>({})

  const selected = monthOptions.find((option) => option.key === selectedKey) ?? monthOptions[0]

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await flushPlaySession(userId)
      const { map } = await loadDayMinutes(userId)
      if (!cancelled) setDayMinutes(map)
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!pickerOpen) return
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.activity-heatmap-picker')) setPickerOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [pickerOpen])

  const weeks = useMemo(
    () => (selected ? buildCalendarCells(selected.year, selected.month) : []),
    [selected],
  )

  if (!selected) return null

  return (
    <section className="activity-heatmap" aria-label={`Activity in ${selected.label}`}>
      <div className="activity-heatmap-top">
        <h3 className="activity-heatmap-title">Activity in {selected.label}</h3>

        <div className="activity-heatmap-picker">
          <button
            type="button"
            className="activity-heatmap-month-btn"
            aria-expanded={pickerOpen}
            aria-haspopup="listbox"
            onClick={() => setPickerOpen((open) => !open)}
          >
            Month
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {pickerOpen ? (
            <ul className="activity-heatmap-month-menu" role="listbox">
              {monthOptions.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.key === selected.key}
                    className={
                      option.key === selected.key
                        ? 'activity-heatmap-month-option activity-heatmap-month-option--active'
                        : 'activity-heatmap-month-option'
                    }
                    onClick={() => {
                      setSelectedKey(option.key)
                      setPickerOpen(false)
                    }}
                  >
                    {option.label} {option.year}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <ul className="activity-heatmap-legend" aria-label="Hours legend">
        {LEGEND.map((item) => (
          <li key={item.label} className="activity-heatmap-legend-item">
            <span
              className={`activity-heatmap-swatch activity-heatmap-swatch--${item.level}`}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="activity-heatmap-grid" role="grid" aria-label="Daily play hours">
        {weeks.map((week, weekIndex) => (
          <div className="activity-heatmap-week" role="row" key={`week-${weekIndex}`}>
            {week.map((cell, dayIndex) => {
              if (!cell) {
                return (
                  <span
                    key={`empty-${weekIndex}-${dayIndex}`}
                    className="activity-heatmap-cell activity-heatmap-cell--empty"
                    aria-hidden="true"
                  />
                )
              }

              const hours = hoursForDay(dayMinutes, cell.key)
              const level = activityLevel(hours)
              const title =
                hours <= 0
                  ? `${selected.label} ${cell.day}: no play`
                  : `${selected.label} ${cell.day}: ${hours.toFixed(1)}h played`

              return (
                <span
                  key={cell.key}
                  className={`activity-heatmap-cell activity-heatmap-cell--${level}`}
                  role="gridcell"
                  title={title}
                  aria-label={title}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="activity-heatmap-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </section>
  )
}
