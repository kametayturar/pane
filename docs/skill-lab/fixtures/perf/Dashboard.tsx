// Tidewater clinic dashboard – works, but it's slow. (fixture for the skill lab)
import * as React from "react"
import _ from "lodash"
import moment from "moment"
import { Chart } from "chart.js/auto"

type Appointment = { id: string; patient: string; start: string; therapistId: string; status: "booked" | "cancelled" | "done" }
type Therapist = { id: string; name: string }

export default function Dashboard({ clinicId }: { clinicId: string }) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [therapists, setTherapists] = React.useState<Therapist[]>([])
  const [stats, setStats] = React.useState<any>(null)
  const [search, setSearch] = React.useState("")
  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    async function load() {
      const a = await fetch(`/api/clinics/${clinicId}/appointments`).then((r) => r.json())
      setAppointments(a)
      const t = await fetch(`/api/clinics/${clinicId}/therapists`).then((r) => r.json())
      setTherapists(t)
      const s = await fetch(`/api/clinics/${clinicId}/stats`).then((r) => r.json())
      setStats(s)
    }
    load()
  }, [clinicId])

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  })

  const filtered = appointments
    .filter((a) => a.patient.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())

  const byTherapist = _.groupBy(filtered, "therapistId")

  return (
    <div>
      <h1>Today · {moment(now).format("HH:mm:ss")}</h1>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients" />
      {stats && <StatsChart data={stats} />}
      {therapists.map((t) => (
        <section key={t.id}>
          <h2>{t.name}</h2>
          {(byTherapist[t.id] || []).map((a, i) => (
            <Row key={i} appointment={a} therapist={therapists.find((x) => x.id === a.therapistId)!} onCancel={() => setAppointments(appointments.filter((x) => x.id !== a.id))} />
          ))}
        </section>
      ))}
    </div>
  )
}

function Row({ appointment, therapist, onCancel }: { appointment: Appointment; therapist: Therapist; onCancel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span>{moment(appointment.start).format("HH:mm")}</span>
      <span>{appointment.patient}</span>
      <span>{therapist.name}</span>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}

function StatsChart({ data }: { data: any }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    new Chart(ref.current!, { type: "line", data: { labels: data.labels, datasets: [{ data: data.values }] } })
  })
  return <canvas ref={ref} />
}
