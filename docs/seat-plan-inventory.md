# Seat-plan inventory

This inventory records the selectable branch/area catalog and the NLB seat-plan
image observed on 10 August 2026 (Asia/Singapore). It is point-in-time evidence
for annotation planning, not a stable NLB API contract. Re-audit a row before
shipping its annotation because NLB can replace a map or change an area's seat
catalog without notice.

## Summary

| Item | Count |
| --- | ---: |
| Selectable branch entries | 23 |
| Selectable areas | 83 |
| Areas with a seat-plan image | 83 |
| Unique seat-plan images | 83 |
| Fully labelled plans | 81 |
| Range-only plans | 1 |
| Hybrid plans | 1 |
| Implemented and tested clickable annotations | 83 |
| Pending clickable annotations | 0 |

The label classifications mean:

- **Full**: every selectable seat appears with its own seat number. A plan stays
  in this category when it also prints a redundant table range for orientation.
- **Range**: the plan identifies seats only through range markers, so individual
  seat-to-shape assignment is not visually explicit.
- **Hybrid**: some seats have individual labels while another run is represented
  only by range markers.

Only a reviewed annotation that passes the validation and test requirements in
[`seat-plan-annotations.md`](seat-plan-annotations.md) is marked **Done**. Image
dimensions below are the source image's natural width and height in pixels.

## Inventory

### Bedok Library (branch 7)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 19 | Adult Non-Fiction, Level 2 | 17 | Full | `bepl-2-adultnonfiction-sp-full.png` | 1338×499 | **Done** |
| 21 | Large Print & AV, Level 2 | 7 | Full | `bepl-2-largeprint-sp-full.png` | 905×404 | **Done** |
| 20 | Learning Zone, Level 2 | 8 | Full | `bepl-2-learningzone-sp-full.png` | 461×502 | **Done** |
| 22 | Teens' Fiction, Level 3 | 36 | Full | `bepl-3-teensfiction-sp-full.png` | 1272×754 | **Done** |

### Bishan Library (branch 8)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 24 | Mother Tongue Collection, Level 3 | 24 | Full | `bipl-3-mothertongue-sp-full.png` | 1027×348 | **Done** |
| 23 | Singapore Collection, Level 3 | 13 | Full | `bipl-3-singaporecollection-sp-full.png` | 934×718 | **Done** |
| 25 | Young People's Collection, Level 4 | 63 | Full | `bipl-4-youngpeople-sp-full.png` | 1036×670 | **Done** |

### Bukit Batok Library (branch 9)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 97 | Study Zone, Level 2 | 26 | Full | `bbpl-2-studyzone-sp-full.png` | 657×811 | **Done** |

### Bukit Panjang Library (branch 10)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 28 | Adult Non-Fiction, Level 4 | 18 | Full | `bppl-3-adultnonfiction-sp-full.png` | 1225×883 | **Done** |
| 29 | Teens' Fiction, Level 4 | 8 | Full | `bppl-3-teensfiction-sp-full.png` | 1015×561 | **Done** |

### Central Public Library (branch 11)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 90 | Reading Zone, Level B1 | 21 | Full | `cll-b1-reading-zone-sp-full.png` | 1537×391 | **Done** |
| 91 | Study Zone, Level B1 | 8 | Full | `cll-b1-study-zone-sp-full.png` | 1173×394 | **Done** |

### Choa Chu Kang Library (branch 4)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 4 | Adult Zone, Level 4 | 16 | Full | `cckpl-4-adultzone-sp-full.png` | 959×202 | **Done** |
| 5 | Study & Multimedia Zone, Level 4 | 28 | Full | `cckpl-4-studyzone-sp-full.png` | 1357×802 | **Done** |

### Clementi Library (branch 13)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 30 | Tamil Collection, Level 5 | 9 | Full | `cmpl-5-tamilcollection-sp-full.png` | 775×304 | **Done** |

### Geylang East Library (branch 14)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 33 | Chinese Collection, Level 2 | 6 | Full | `gepl-2-chinesecollection-sp-full.png` | 486×721 | **Done** |
| 98 | English Fiction Collection, Level 2 | 1 | Full | `gepl-2-english-fiction-sp-full.png` | 705×499 | **Done** |
| 31 | Magazine Collection, Level 2 | 22 | Full | `gepl-2-magazine-collection-sp-full.png` | 1174×682 | **Done** |
| 32 | Near Multimedia Stations, Level 2 | 10 | Full | `gepl-2-nearmultimedia-sp-full.png` | 816×726 | **Done** |
| 34 | Quiet Reading Room, Level 2 | 16 | Full | `gepl-2-quietreading-sp-full.png` | 918×562 | **Done** |
| 35 | Young People's Collection, Level 2 | 7 | Full | `gepl-2-youngpeople-sp-full.png` | 841×411 | **Done** |

### Harbourfront Library (branch 20)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 39 | Adult Collection, Level 3 | 14 | Full | `hbpl-3-adultcollection-sp-full.png?t=20220615` | 628×807 | **Done** |
| 38 | Reading Lounge 1 Bottom Tier, Level 3 | 7 | Full | `hbpl-3-readinglounge1bottom-sp-full.png?t=20220615` | 592×480 | **Done** |
| 37 | Reading Lounge 1 Middle Tier, Level 3 | 14 | Full | `hbpl-3-readinglounge1middle-sp-full.png?t=20220615` | 745×461 | **Done** |
| 36 | Reading Lounge 1 Upper Tier, Level 3 | 9 | Full | `hbpl-3-readinglounge1upper-sp-full.png?t=20220615` | 557×314 | **Done** |
| 102 | Singapore Collection, Level 3 | 10 | Full | `hbpl-3-singaporecollection-sp-full.png` | 1166×428 | **Done** |

### Jurong Library (branch 2)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 42 | Chinese Collection, Level 3 | 68 | **Hybrid** | `jrl-3-chinesecollection-sp-full.png?t=20221130` | 1988×1141 | **Done** |
| 40 | English Fiction, Level 2 | 52 | Full | `jrl-2-englishfiction-sp-full.png` | 1036×326 | **Done** |
| 41 | English Non-Fiction, Level 2 | 40 | **Range** | `jrl-2-englishnonfiction-sp-full.png` | 1034×308 | **Done** |
| 43 | Study Area Near Escalator, Level 3 | 30 | Full | `jrl-3-studyareaescalator-sp-full.png?t=20221130` | 1824×1208 | **Done** |
| 2 | Study Area, Level 3 | 198 | Full | `jrl-3-studyarea-sp-full.png?t=20221130` | 1126×844 | **Done** |

### Jurong West Library (branch 15)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 44 | Beside Quiet Reading Area, Level 3 | 18 | Full | `jwpl-3-quietreading-sp-full.png` | 796×273 | **Done** |
| 45 | Beside Stairwell, Level 3 | 40 | Full | `jwpl-3-stairwell-sp-full.png` | 842×254 | **Done** |

### Lee Kong Chian Reference Library Level 11 (branch 16)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 6 | Express Seats Zone D1, Level 11 | 67 | Full | `lkcrl11-11-zoned1-sp-full.png` | 1447×642 | **Done** |
| 10 | Express Seats Zone D2, Level 11 | 28 | Full | `lkcrl11-11-zoned2-sp-full.png` | 905×305 | **Done** |

### Lee Kong Chian Reference Library Levels 7 to 9 (branch 17)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 7 | Express Seats Zone A, Level 7 | 59 | Full | `lkcrl7to9-7-zonea-sp-full.png` | 1251×556 | **Done** |
| 8 | Express Seats Zone B, Level 8 | 30 | Full | `lkcrl7to9-8-zoneb-sp-full.png` | 1267×585 | **Done** |
| 9 | Express Seats Zone C, Level 9 | 67 | Full | `lkcrl7to9-9-zonec-sp-full.png` | 1440×771 | **Done** |
| 94 | Launch Hot Desk Zone, Level 7 | 48 | Full | `lkcrl7to9-7-hot-desk-zone-sp.png` | 2765×2383 | **Done** |

### Pasir Ris Library (branch 24)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 47 | Quiet Reading Lounge, Level 4 | 13 | Full | `prpl-4-quietreading-sp-full.png` | 769×618 | **Done** |

### Punggol Library (branch 33)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 84 | Adults Teens Chinese Fiction Zone, Level 3 | 13 | Full | `prl-3-at-chinese-fiction-zone-sp-full.png` | 1249×330 | **Done** |
| 87 | Beside Chinese Non-Fiction, Level 4 | 15 | Full | `prl-4-beside-chinese-non-fiction-sp-full.png` | 1917×963 | **Done** |
| 86 | Launch and Co-Working Zone, Level 4 | 37 | Full | `prl-4-launch-coworking-zone-sp-full.png` | 3015×2092 | **Done** |
| 85 | Long Study Space, Level 3 | 36 | Full | `prl-3-long-study-space-sp-full.png` | 1372×466 | **Done** |
| 88 | Long Study Space, Level 4 | 36 | Full | `prl-4-long-study-space-sp-full.png` | 1529×474 | **Done** |
| 83 | Study Zone, Level 3 | 86 | Full | `prl-3-study-zone-sp-full.png` | 1755×1040 | **Done** |

### Queenstown Library (branch 25)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 49 | Near Quiet Reading Room, Level 2 | 20 | Full | `qupl-2-quietreading-sp-full.png` | 3832×703 | **Done** |
| 48 | Singapore Collection, Level 2 | 30 | Full | `qupl-2-singaporecollection-sp-full.png` | 4246×691 | **Done** |

### Sembawang Library (branch 26)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 50 | Adult Section, Level 5 | 8 | Full | `sbpl-5-adultsection-sp-full.png` | 852×293 | **Done** |
| 51 | Reading Lounge, Level 5 | 2 | Full | `sbpl-5-readinglounge-sp-full.png` | 511×468 | **Done** |

### Sengkang Library (branch 27)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 52 | Reading Lounge, Level 3 | 10 | Full | `skpl-3-readinglounge-sp-full.png` | 1194×645 | **Done** |

### Serangoon Library (branch 28)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 53 | Near Adult English General Collection, Level 4 | 10 | Full | `srpl-4-englishgeneralcollection-sp-full.png` | 1246×339 | **Done** |
| 54 | Near Chinese Children Collection, Level 4 | 11 | Full | `srpl-4-childrencollection-sp-full.png` | 934×282 | **Done** |

### Tampines Library (branch 1)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 95 | Co-Working Lounge, Level 5 | 30 | Full | `trl-5-coworking-lounge-sp-full.png` | 3783×1884 | **Done** |
| 80 | MMS Area, Level 4 | 4 | Full | `trl-4-mmsarea-sp-full.png` | 3770×1879 | **Done** |
| 55 | Near Multimedia Stations, Level 4 | 24 | Full | `trl-4-nearmultimedia-sp-full.png` | 970×564 | **Done** |
| 81 | Outside Study Lounge, Level 5 | 24 | Full | `trl-5-outsidestudylounge-sp-full.png` | 1273×2098 | **Done** |
| 82 | SG Collection, Level 5 | 20 | Full | `trl-5-sgcollection-sp-full.png` | 568×811 | **Done** |
| 56 | Study Area, Level 5 | 24 | Full | `trl-5-studyarea-sp-full.png` | 3769×1876 | **Done** |
| 1 | Study Lounge, Level 5 | 40 | Full | `trl-5-studylounge-sp-full.png` | 1273×2098 | **Done** |

### Toa Payoh Library (branch 30)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 61 | Audio Visual Collection, Level 3 | 12 | Full | `tppl-3-avcollection-sp-full.png` | 907×412 | **Done** |
| 59 | Beside Seating Area, Level 2 | 22 | Full | `tppl-2-besideseatingarea-sp-full.png` | 881×392 | **Done** |
| 57 | English Fiction, Level 2 | 12 | Full | `tppl-2-englishfiction-sp-full.png` | 516×353 | **Done** |
| 78 | Magazine Lounge, Level 2 | 15 | Full | `tppl-2-magazinelounge-sp-full.png` | 1240×363 | **Done** |
| 60 | Near Lift Lobby, Level 2 | 4 | Full | `tppl-2-nearliftlobby-sp-full.png` | 490×556 | **Done** |
| 58 | Near Multimedia Stations, Level 2 | 10 | Full | `tppl-2-nearmultimedia-sp-full.png` | 534×560 | **Done** |

### Woodlands Library (branch 31)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 62 | Work & Study Zone A, Level 1 | 16 | Full | `wrl-1-studyzonea-sp-full.png` | 640×368 | **Done** |
| 63 | Work & Study Zone B, Level 1 | 6 | Full | `wrl-1-studyzoneb-sp-full.png` | 640×379 | **Done** |
| 64 | Work & Study Zone C, Level 2 | 42 | Full | `wrl-2-studyzonec-sp-full.png` | 1042×556 | **Done** |
| 65 | Work & Study Zone D, Level 2 | 30 | Full | `wrl-2-studyzoned-sp-full.png` | 1041×536 | **Done** |
| 66 | Work & Study Zone E, Level 2 | 6 | Full | `wrl-2-studyzonee-sp-full.png` | 933×526 | **Done** |
| 67 | Work & Study Zone F, Level 2 | 33 | Full | `wrl-2-studyzonef-sp-full.png` | 974×570 | **Done** |
| 68 | Work & Study Zone G, Level 2 | 24 | Full | `wrl-2-studyzoneg-sp-full.png` | 979×554 | **Done** |
| 69 | Work & Study Zone H, Level 2 | 7 | Full | `wrl-2-studyzoneh-sp-full.png` | 745×469 | **Done** |
| 70 | Work & Study Zone J, Level 3 | 6 | Full | `wrl-3-studyzonej-sp-full.png` | 929×527 | **Done** |
| 71 | Work & Study Zone K, Level 3 | 30 | Full | `wrl-3-studyzonek-sp-full.png` | 1039×564 | **Done** |
| 72 | Work & Study Zone L, Level 3 | 34 | Full | `wrl-3-studyzonel-sp-full.png` | 980×532 | **Done** |
| 73 | Work & Study Zone M, Level 3 | 48 | Full | `wrl-3-studyzonem-sp-full.png` | 1040×531 | **Done** |
| 74 | Work & Study Zone N, Level 3 | 16 | Full | `wrl-3-studyzonen-sp-full.png` | 1004×494 | **Done** |
| 75 | Work & Study Zone P, Level 3 | 10 | Full | `wrl-3-studyzonep-sp-full.png` | 786×486 | **Done** |

### Yishun Library (branch 32)

| Area ID | Area | Seats | Labels | Map asset | Size | Annotation |
| ---: | --- | ---: | --- | --- | ---: | --- |
| 101 | Digital Learning Zone, Level 4 | 10 | Full | `yipl-4-digitallearningzone-sp-full.png` | 355×214 | **Done** |
| 76 | English Fiction, Level 4 | 8 | Full | `yipl-4-englishfiction-sp-full.png` | 1129×448 | **Done** |
| 77 | Malay Collection, Level 4 | 23 | Full | `yipl-4-malaycollection-sp-full.png` | 507×563 | **Done** |
