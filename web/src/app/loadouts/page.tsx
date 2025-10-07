'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Users, Star } from 'lucide-react';
import { useLoadouts } from '@/hooks/useLoadouts';
import { LoadoutCard } from '@/components/shared/LoadoutCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Tab = 'my-loadouts' | 'community' | 'create';

export default function LoadoutsPage() {
  const { isAuthenticated } = useAuth();
  const { loadouts, loading, error, deleteLoadout } = useLoadouts();
  const [activeTab, setActiveTab] = useState<Tab>('my-loadouts');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (loadoutId: string) => {
    if (confirm('Are you sure you want to delete this loadout?')) {
      await deleteLoadout(loadoutId);
      toast.success('Loadout deleted successfully');
    }
  };

  const handleShare = (loadoutId: string) => {
    // Copy share link to clipboard
    const url = `${window.location.origin}/loadouts/${loadoutId}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  const filteredLoadouts = loadouts.filter((loadout) =>
    loadout.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cod-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-cod-gray to-cod-black border-b border-cod-surface">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              <span className="gradient-text">Loadout Arsenal</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Build, save, and share your perfect loadouts. Learn from the best in the community.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 glass rounded-lg p-1">
            <button
              onClick={() => setActiveTab('my-loadouts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'my-loadouts'
                  ? 'bg-cod-orange text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              My Loadouts
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'community'
                  ? 'bg-cod-orange text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Community
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-cod-orange text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>

        {/* My Loadouts Tab */}
        {activeTab === 'my-loadouts' && (
          <div>
            {!isAuthenticated ? (
              <div className="text-center py-16">
                <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sign in to view your loadouts</h3>
                <p className="text-gray-400 mb-6">Create an account to save and manage your loadouts</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search your loadouts..."
                  />
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="glass rounded-xl p-6 h-64 skeleton" />
                    ))}
                  </div>
                ) : filteredLoadouts.length === 0 ? (
                  <div className="text-center py-16">
                    <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No loadouts yet</h3>
                    <p className="text-gray-400 mb-6">
                      {searchQuery ? 'No loadouts match your search' : 'Create your first loadout to get started'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setActiveTab('create')}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Create Loadout
                      </button>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredLoadouts.map((loadout, index) => (
                      <motion.div
                        key={loadout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <LoadoutCard
                          loadout={loadout}
                          onDelete={() => handleDelete(loadout.id)}
                          onShare={() => handleShare(loadout.id)}
                          showActions
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div>
            <div className="mb-6 flex gap-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search community loadouts..."
                className="flex-1"
              />
              <select className="px-4 py-2 bg-cod-surface border border-cod-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cod-orange">
                <option>Most Popular</option>
                <option>Highest Rated</option>
                <option>Recently Added</option>
              </select>
            </div>

            {/* Featured Community Loadouts */}
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                <Star className="inline h-6 w-6 text-cod-orange mr-2" />
                Featured Loadouts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadouts.slice(0, 3).map((loadout) => (
                  <LoadoutCard
                    key={loadout.id}
                    loadout={loadout}
                    showActions={false}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                All Community Loadouts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadouts.map((loadout) => (
                  <LoadoutCard
                    key={loadout.id}
                    loadout={loadout}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="max-w-4xl mx-auto">
            <div className="glass-premium rounded-2xl p-8 border border-cod-orange/30">
              <h2 className="text-3xl font-display font-bold text-white mb-2">
                Create New Loadout
              </h2>
              <p className="text-gray-400 mb-8">
                Build your perfect loadout with our interactive builder
              </p>

              <div className="text-center py-16">
                <Shield className="h-24 w-24 text-cod-orange mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-bold text-white mb-4">
                  Loadout Builder Coming Soon
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  We&apos;re working on an amazing interactive loadout builder. For now, you can ask our AI
                  assistant to create custom loadouts for you!
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-cod-surface rounded-lg text-gray-400">
                  <span>💡 Try asking:</span>
                  <span className="text-cod-orange font-semibold">
                    &ldquo;Create an aggressive SMG loadout for MW3&rdquo;
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
