"use client"

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, Clock, AlertCircle, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from "next/navigation";
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

interface Website {
  id: string;
  url: string;
  timeAdded: string;
  email: string;
  tickes: Tick[];
}

interface DashboardProps {
  onViewDetails: (websiteId: string) => void;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const {user, isLoading} = useUser();
  const [websites, setWebsites] = useState<Website[]>([])
  
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jwt, setJwt] = useState('')
  const [userEmail, setUserEmail] = useState<string | undefined>('')

  const fetchWebsites = async () => {
    try{
      setLoading(true)

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/allWebsites/${userEmail}`, {
        headers: {
          "Authorization": `Bearer ${jwt}`
        }
      })
      const json = await res.json()
      console.log(json.data)
      setWebsites(json.data)

      setLoading(false)
    }catch(err){
      console.log(err)
      setLoading(false)
    }
  };

  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    console.log(newUrl)

    setIsAdding(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          url: newUrl,
          email: userEmail,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setNewUrl('');
        await fetchWebsites();
      } else {
        setError(result.message || 'Failed to add website');
      }
    } catch (err) {
      setError('Failed to add website');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteWebsite = async (websiteId: string, url: string) => {
    if (!confirm(`Are you sure you want to delete monitoring for ${url}?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/website`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ 
          website_id: websiteId,
          email: userEmail,
        }),
      });

      if (response.ok) {
        await fetchWebsites();
      } else {
        setError('Failed to delete website');
      }
    } catch (err) {
      setError('Failed to delete website');
    }
  };

  const getStatusInfo = (website: Website) => {
    if (!website.tickes || website.tickes.length === 0) {
      return { status: 'Checking', color: 'text-yellow-400', bgColor: 'bg-yellow-400', icon: Clock };
    }

    const latestTick = website.tickes[website.tickes.length - 1];
    const isUp = latestTick.status === 'Up';
    
    return {
      status: latestTick.status,
      color: isUp ? 'text-green-400' : 'text-red-400',
      bgColor: isUp ? 'bg-green-400' : 'bg-red-400',
      responseTime: latestTick.response_time,
      icon: isUp ? CheckCircle : XCircle,
    };
  };

  useEffect(() => {

    if (!isLoading && !user) {
      // Only redirect if auth finished loading AND user is not logged in
      router.push('/');
      return;
    }

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
  
    fetchWebsites();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWebsites, 60000);

    return () => clearInterval(interval);
  }, [userEmail, user, isLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const onBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home Page
          </button>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Website Monitoring</h1>
            <p className="text-purple-300">Monitor your websites and get instant alerts</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Live Status
          </div>
        </div>

        {/* Add Website Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Website</h2>
          <form onSubmit={addWebsite} className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdding ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isAdding ? 'Adding...' : 'Add Website'}
            </button>
          </form>
          {error && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Websites List */}
        <div className="space-y-4">
          {websites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No websites added yet</h3>
              <p className="text-slate-400">Add your first website to start monitoring</p>
            </div>
          ) : (
            websites.map((website) => {
              const statusInfo = getStatusInfo(website);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={website.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 sm:p-6 hover:bg-slate-800/70 transition-all duration-200 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                    <div className="space-y-1 min-w-0">
                      {/* URL */}
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-purple-200 transition-colors truncate max-w-[calc(100vw-200px)] sm:max-w-none">
                          {website.url}
                        </h3>
                      </div>
                      
                      {/* Status and Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color} flex-shrink-0`} />
                          <span>{statusInfo.status}</span>
                        </div>
                        
                        {statusInfo.responseTime && (
                          <span>Response: {statusInfo.responseTime}ms</span>
                        )}
                        
                        <span>
                          Last: {website.tickes[0] ? new Date(website.tickes[0]?.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Pending"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => router.push(`/website/${website.id}`)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-600/30 rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deleteWebsite(website.id, website.url)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 flex-shrink-0"
                        title="Delete website"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const page = () => {
  
  return (
    <div>
      <Dashboard />
    </div>
  )
}

export default page
