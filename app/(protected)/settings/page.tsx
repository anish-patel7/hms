"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Save,
  Key,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check
} from 'lucide-react'
import { getSettings, updateSettings, changePassword, exportData, importData, resetData, hashPassword } from '@/lib/storage'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const [groupName, setGroupName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const settings = getSettings()
    setGroupName(settings.groupName)
  }, [])

  const handleSaveGroupName = () => {
    setSaveStatus('saving')
    updateSettings({ groupName })
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordStatus('saving')

    // Verify current password
    const settings = getSettings()
    if (hashPassword(currentPassword) !== settings.passwordHash) {
      setPasswordError('Current password is incorrect')
      setPasswordStatus('error')
      return
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordStatus('error')
      return
    }

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters')
      setPasswordStatus('error')
      return
    }

    changePassword(newPassword)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordStatus('saved')
    setTimeout(() => setPasswordStatus('idle'), 2000)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-voyage-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (importData(content)) {
        window.location.reload()
      } else {
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    resetData()
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your group settings</p>
      </div>

      {/* Group Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </CardTitle>
          <CardDescription>
            Customize your group identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="groupName">Group Name</Label>
            <div className="flex gap-2">
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Your group name"
              />
              <Button onClick={handleSaveGroupName} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saved' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update the shared group password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          <Button 
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || passwordStatus === 'saving'}
          >
            {passwordStatus === 'saved' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Password Changed
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or reset your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Reset all data to sample data. This will delete all your trips, polls, and memories.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Sample Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Reset All Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your trips, polls, members, and memories, 
                    and replace them with sample data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All data is stored locally in your browser. 
            To share data across devices, use the export/import feature or consider 
            upgrading to cloud storage.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
