# Artifact reference

| Artifact | Can indicate | Cannot independently prove | Typical semantics / limitations |
|---|---|---|---|
| USBSTOR | device identity/history | a file copy | Registry write/last-write; fields vary |
| MountedDevices / MountPoints2 | volume or user mount association | exact connection time or transfer | mappings may persist |
| EVTX-derived event | device/session/system activity | named-file copying unless explicitly logged | logging varies by edition/policy |
| LNK / Recent Documents | user-context interaction with a target | content read or transfer | creation/access semantics vary |
| Jump List | application/file association | malicious intent | app-dependent retention |
| Prefetch | application execution | which document was transferred | disabled/absent on some systems |
| Office artifacts | recent/open document association | USB destination write | application/version dependent |
| Shellbags | folder navigation/history | file contents or copying | timestamps and retention vary |
| Recycle Bin | deletion metadata | concealment intent | bypass/deletion methods vary |
| NTFS listing | path, size, MAC times | actor/intent by itself | timestamp tunneling and copy semantics |
| Archive artifact | archive creation/presence | its purpose or transfer | contents require separate examination |

Every normalized record preserves raw metadata, records observed and inferred fields, explicitly labels timestamp type, and retains provenance. Simulation metadata is not forensic evidence.

