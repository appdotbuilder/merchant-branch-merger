
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { MerchantBranch } from '../../server/src/schema';



function App() {
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [canonicalBranchId, setCanonicalBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Load branches from backend
  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Attempt to connect to backend
      const result = await trpc.getMerchantBranches.query();
      setBackendConnected(true);
      setBranches(result);
    } catch {
      // Backend not available or error occurred
      console.log('🔧 Backend unavailable');
      setBackendConnected(false);
      setBranches([]);
    } finally {
      setIsLoading(false);
      setConnectionAttempted(true);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Handle branch selection
  const handleBranchSelection = (branchId: string, checked: boolean) => {
    setSelectedBranchIds((prev: string[]) => {
      if (checked) {
        return [...prev, branchId];
      } else {
        return prev.filter(id => id !== branchId);
      }
    });

    // Clear canonical selection if it's no longer in selected branches
    if (!checked && canonicalBranchId === branchId) {
      setCanonicalBranchId('');
    }
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedBranchIds.length === branches.length) {
      setSelectedBranchIds([]);
      setCanonicalBranchId('');
    } else {
      setSelectedBranchIds(branches.map(branch => branch.id));
    }
  };

  // Handle merge operation
  const handleMerge = async () => {
    if (!canonicalBranchId || selectedBranchIds.length < 2) {
      alert('Please select at least 2 branches and choose a canonical branch');
      return;
    }

    const branchesToMerge = selectedBranchIds.filter(id => id !== canonicalBranchId);
    
    if (branchesToMerge.length === 0) {
      alert('Please select additional branches to merge into the canonical branch');
      return;
    }

    setIsMerging(true);
    
    try {
      // Try backend merge
      const result = await trpc.mergeMerchantBranches.mutate({
        canonical_branch_id: canonicalBranchId,
        branch_ids_to_merge: branchesToMerge
      });
      console.log('✅ Backend merge completed:', result);

      // Update local state to reflect the merge
      setBranches((prev: MerchantBranch[]) => 
        prev.filter(branch => !branchesToMerge.includes(branch.id))
      );
      
      // Clear selections
      setSelectedBranchIds([]);
      setCanonicalBranchId('');
      
      // Show success message
      const canonicalBranch = branches.find(b => b.id === canonicalBranchId);
      alert(`✅ Successfully merged ${branchesToMerge.length} branches into: ${canonicalBranch?.name}`);
      
    } catch (mergeError) {
      console.error('Merge failed:', mergeError);
      alert('❌ Failed to merge branches. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const selectedBranches = branches.filter(branch => selectedBranchIds.includes(branch.id));
  const canMerge = selectedBranchIds.length >= 2 && canonicalBranchId && selectedBranchIds.includes(canonicalBranchId) && backendConnected;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🏪 Merchant Branch Manager</h1>
        <p className="text-gray-600">Select multiple branches to merge them into a single canonical branch</p>
      </div>

      {/* Connection Status */}
      {connectionAttempted && (
        <div className={`mb-6 p-4 rounded-md border ${
          backendConnected 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <p className="flex items-center gap-2">
            {backendConnected ? (
              <>🟢 Connected to backend server</>
            ) : (
              <>🔴 Backend server unavailable</>
            )}
          </p>
        </div>
      )}

      {/* Merge Controls */}
      {selectedBranchIds.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">🔄 Merge Configuration</CardTitle>
            <CardDescription>
              {selectedBranchIds.length} branches selected. Choose which branch should become the canonical (main) branch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Canonical Branch (data will be merged into this branch):
              </label>
              <Select value={canonicalBranchId} onValueChange={setCanonicalBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose the main branch to keep..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedBranches.map((branch: MerchantBranch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{branch.name}</span>
                        {branch.address && (
                          <span className="text-sm text-gray-500">• {branch.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canonicalBranchId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Merge Summary:</strong> {selectedBranchIds.length - 1} branches will be merged into{' '}
                  <strong>{branches.find(b => b.id === canonicalBranchId)?.name}</strong>. 
                  All associated data will be transferred to the canonical branch.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={!canMerge || isMerging || !backendConnected}
                    className="flex items-center gap-2"
                  >
                    {isMerging ? '🔄 Merging...' : '🔄 Merge Branches'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Confirm Branch Merge</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>This action will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Merge {selectedBranchIds.length - 1} branches into the canonical branch</li>
                        <li>Transfer all associated data (transactions, orders, etc.) to the canonical branch</li>
                        <li>Permanently delete the merged branches</li>
                      </ul>
                      <p className="font-semibold text-red-600">
                        This action cannot be undone!
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMerge} className="bg-red-600 hover:bg-red-700">
                      Confirm Merge
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedBranchIds([]);
                  setCanonicalBranchId('');
                }}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branch List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📋 Merchant Branches</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading branches...' : `${branches.length} branches available`}
              </CardDescription>
            </div>
            {branches.length > 0 && !isLoading && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedBranchIds.length === branches.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">🔄 Loading merchant branches...</div>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>📭 No merchant branches found. Please populate the database with branches to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch: MerchantBranch) => {
                const isSelected = selectedBranchIds.includes(branch.id);
                const isCanonical = canonicalBranchId === branch.id;
                
                return (
                  <div
                    key={branch.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected 
                        ? isCanonical 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked: boolean) => 
                          handleBranchSelection(branch.id, checked)
                        }
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{branch.name}</h3>
                          {isCanonical && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ⭐ Canonical Branch
                            </Badge>
                          )}
                          {isSelected && !isCanonical && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              ✅ Selected for Merge
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {branch.address && (
                            <p className="flex items-center gap-1">
                              📍 {branch.address}
                            </p>
                          )}
                          {branch.source_url && (
                            <p className="flex items-center gap-1">
                              🔗 <a href={branch.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {branch.source_url}
                              </a>
                            </p>
                          )}
                          <p className="flex items-center gap-1">
                            📅 Added: {branch.date_added_utc.toLocaleDateString()}
                          </p>
                          {branch.merchant_id && (
                            <p className="flex items-center gap-1">
                              🏢 Merchant ID: {branch.merchant_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Footer */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>💡 Application Status:</strong> This UI demonstrates the complete merchant branch management workflow. 
          {backendConnected 
            ? ' Connected to backend server for live data operations.' 
            : ' Backend server unavailable - please check your connection and try again.'
          }
        </p>
      </div>
    </div>
  );
}

export default App;
