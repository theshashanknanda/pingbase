"use client"

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, Router } from 'lucide-react';
import {useRouter} from "next/navigation"
import { useParams } from "next/navigation";
import { getAccessToken } from "@auth0/nextjs-auth0";
import { useUser } from "@auth0/nextjs-auth0"

interface Tick {
  id: string;
  response_time: number;
  status: 'Up' | 'Down' | 'Checking';
  region_id: string;
  website_id: string;
  createdAt: string;
  region?: {
    id: string;
    name: string;
  };
}

interface WebsiteDetailsProps {
  websiteId: string;
  onBack: () => void;
}

const WebsiteDetails: React.FC = () => {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [websiteId, setWebsiteId] = useState('')
  const [jwt, setJwt] = useState('')
  const [userEmail, setUserEmail] = useState<string | undefined>('')
  
  const params = useParams();  
  const router = useRouter()
  const {user, isLoading} = useUser();

  const onBack = () => {
    router.push('/dashboard')
  }

  const fetchWebsiteStatus = async () => {
    try{
      setLoading(true);
      
      // fetch last 20 ticks
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/status/${websiteId}`, {
        headers: {
          "Authorization": `Bearer ${jwt}`,
        }
      })
      const json = await res.json();

      setTicks(json)
      console.log(json)

      setLoading(false);
    }catch(error){
      console.log(error)
    }
  };

  const calculateStats = () => {
    if (!ticks.length) return { uptime: 'N/A', avgResponse: 'N/A', totalChecks: 0 };
    
    const upCount = ticks.filter(tick => tick.status === 'Up').length;
    const uptime = ((upCount / ticks.length) * 100).toFixed(1);
    
    const responseTimes = ticks
      .filter(tick => tick.status === 'Up')
      .map(tick => tick.response_time);
    const avgResponse = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    return {
      uptime: `${uptime}%`,
      avgResponse: `${avgResponse}ms`,
      totalChecks: ticks.length
    };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Up':
        return {
          text: 'text-green-400',
          bg: 'bg-green-400',
          bgLight: 'bg-green-900/20',
          border: 'border-green-800'
        };
      case 'Down':
        return {
          text: 'text-red-400',
          bg: 'bg-red-400',
          bgLight: 'bg-red-900/20',
          border: 'border-red-800'
        };
      default:
        return {
          text: 'text-yellow-400',
          bg: 'bg-yellow-400',
          bgLight: 'bg-yellow-900/20',
          border: 'border-yellow-800'
        };
    }
  };

  const stats = calculateStats();

  useEffect(() => {  
    if (!isLoading && !user) {
      // Only redirect if auth finished loading AND user is not logged in
      router.push('/');
      return;
    }

    const id = params.id;
    async function fetchData() {
          try {
            const token = await getAccessToken();
            setJwt(token)
    
            setUserEmail(user?.email)
          } catch (err) {
            console.log(err)
          }
        }
    
        fetchData()
    // @ts-ignore
    setWebsiteId(id)

    fetchWebsiteStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWebsiteStatus, 60000);
    return () => clearInterval(interval);
  }, [websiteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading website details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-purple-300 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:inline">Back</span>
          </button>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mt-1 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Website Details</h1>
            <p className="text-sm sm:text-base text-purple-300 break-all">{websiteUrl}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-white">Checks (20m)</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.totalChecks}</p>
            <p className="text-xs sm:text-sm text-slate-400">Status checks</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-white">Uptime</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.uptime}</p>
            <p className="text-xs sm:text-sm text-slate-400">Last {stats.totalChecks} checks</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-white">Avg Response</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-400">{stats.avgResponse}</p>
            <p className="text-xs sm:text-sm text-slate-400">Average response</p>
          </div>
        </div>

        {/* Recent Status Checks */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Recent Status Checks (Last 20)</h2>
          
          {ticks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm sm:text-base">No status checks available yet</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Checks will appear here as they are performed</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {ticks.slice().map((tick) => {
                const colors = getStatusColor(tick.status);
                const { date, time } = formatDateTime(tick.createdAt);
                const StatusIcon = tick.status === 'Up' ? CheckCircle : tick.status === 'Down' ? XCircle : Clock;

                return (
                  <div
                    key={tick.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 ${colors.bgLight} border ${colors.border} rounded-lg hover:bg-opacity-80 transition-all duration-200`}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 ${colors.bg} rounded-full shadow-lg flex-shrink-0`}></div>
                        <StatusIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.text} flex-shrink-0`} />
                        <span className={`text-sm font-medium ${colors.text} whitespace-nowrap`}>
                          {tick.status}
                        </span>
                      </div>
                      {tick.status === 'Up' && (
                        <span className="text-xs sm:text-sm text-slate-300 whitespace-nowrap">
                          {tick.response_time}ms
                        </span>
                      )}
                      {tick.region?.name && (
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded whitespace-nowrap">
                          {tick.region.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-0">
                      <div className="sm:text-right">{date}</div>
                      <div className="text-xs text-slate-500 sm:text-right">{time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const page = () => {
  return (
    <div>
      <WebsiteDetails/>
    </div>
  )
}

export default page
