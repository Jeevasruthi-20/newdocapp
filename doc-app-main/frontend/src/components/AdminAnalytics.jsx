import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';
import { apiJson } from '../lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  pending: '#FFBB28',
  confirmed: '#0088FE',
  completed: '#00C49F',
  cancelled: '#FF8042'
};

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState('30d');
  
  const [timeData, setTimeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [specialtiesData, setSpecialtiesData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [timeRes, statusRes, specRes, docRes] = await Promise.all([
          apiJson(`/api/admin/analytics/appointments-over-time?range=${dateRange}`),
          apiJson(`/api/admin/analytics/status-breakdown`),
          apiJson(`/api/admin/analytics/top-specialties`),
          apiJson(`/api/admin/analytics/doctor-utilization`)
        ]);
        
        setTimeData(timeRes || []);
        setStatusData(statusRes || []);
        setSpecialtiesData(specRes || []);
        setDoctorData(docRes || []);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="analytics-loading grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="analytics-container p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
        <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === '30d' ? 'bg-white shadow-sm text-medical-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setDateRange('30d')}
          >
            Last 30 Days
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === '90d' ? 'bg-white shadow-sm text-medical-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setDateRange('90d')}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments Over Time */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Bookings Over Time</h3>
          {timeData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No booking activity in this range</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={20} />
                  <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Appointment Status</h3>
          {statusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No appointments found</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status?.toLowerCase()] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Specialties */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Top 5 Specialties</h3>
          {specialtiesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No specialty data</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specialtiesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="specialty" type="category" tick={{fontSize: 12}} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {specialtiesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Doctor Utilization */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Doctor Utilization (Top 10)</h3>
          {doctorData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No doctor utilization data</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <XAxis dataKey="doctorName" tick={{fontSize: 11}} angle={-45} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
