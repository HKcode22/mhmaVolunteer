# macOS Speed & Cleanup Guide

## Quick Force-Kill Commands

### Kill a specific process by name
```bash
pkill -f "ProcessName"
# Example: pkill -f "BackgroundShortcutRunner"
```

### Kill a process by PID
```bash
kill -9 PID
# Example: kill -9 76193
```

### List top memory hogs
```bash
ps aux | sort -nrk 4 | head -20
```

### List top CPU hogs
```bash
ps aux | sort -nrk 3 | head -20
```

### Kill all Chrome helpers (close Chrome first)
```bash
pkill -f "Google Chrome Helper"
```

### Kill all mdworker (Spotlight indexing) temporarily
```bash
pkill -f mdworker_shared
```

### Find and kill all processes of an app
```bash
ps aux | grep -i "appname" | grep -v grep | awk '{print $2}' | xargs kill -9
```

---

## Preventing Apps From Coming Back

### Check what auto-starts at login
```bash
osascript -e 'tell application "System Events" to get name of every login item'
```

### Remove a login item
```bash
osascript -e 'tell application "System Events" to delete login item "AppName"'
```

### List launch agents (user-level auto-start)
```bash
ls ~/Library/LaunchAgents/
```

### List launch daemons (system-level auto-start, needs sudo)
```bash
ls /Library/LaunchDaemons/
ls /Library/LaunchAgents/
```

### Stop & remove a launch agent (user level)
```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.example.plist
rm ~/Library/LaunchAgents/com.example.plist
```

### Stop & remove a launch daemon (system level - needs sudo)
```bash
sudo launchctl bootout system /Library/LaunchDaemons/com.example.plist
sudo rm /Library/LaunchDaemons/com.example.plist
```

---

## Deleting Stubborn Apps

### Move to Trash via terminal
```bash
osascript -e 'tell application "Finder" to delete POSIX file "/Applications/AppName.app"'
```

### Remove all leftover support files
```bash
rm -rf ~/Library/Application\ Support/AppName
rm -rf ~/Library/Caches/com.appname.*
rm -rf ~/Library/Preferences/com.appname*
```

---

## Free Up Memory Now

1. Check what's using memory:
   ```bash
   ps aux | sort -nrk 4 | head -10
   ```

2. Close unnecessary apps or kill their processes (pkill -f Name)

3. Clear system caches (won't delete personal files):
   ```bash
   sudo purge
   ```

4. Restart Finder (frees memory):
   ```bash
   killall Finder
   ```

---

## When All Else Fails

Restart your Mac completely:
```bash
sudo shutdown -r now
```

or use the Apple menu -> Restart (hold down keys to force if frozen).

---

## Apps Cleaned Up (June 4, 2026)

**Deleted (moved to Trash):**
- Malwarebytes, BlueStacks, BlueStacksMIM
- Trae, TRAE 2, TRAE SOLO
- Ludo King, Ludo Star, Ludo Star 2021, Ludo SNG
- Among Us, Antigravity, Roblox
- Cursor, Zed, Ollama
- Cluely (New), zoom.us
