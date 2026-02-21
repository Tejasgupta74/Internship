import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month:'Jan', placements:2 },
  { month:'Feb', placements:4 },
  { month:'Mar', placements:6 },
  { month:'Apr', placements:10 },
  { month:'May', placements:12 },
  { month:'Jun', placements:18 },
]

export default function PlacementsChart(){
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5b8cff" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#5b8cff" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{fill:'#9fb0ff'}} />
        <YAxis tick={{fill:'#9fb0ff'}} />
        <Tooltip />
        <Area type="monotone" dataKey="placements" stroke="#5b8cff" fill="url(#c1)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
