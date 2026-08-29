// Shared mock data for Alumni, Inventory, Finance, and Archive in KSM AIoT

export const initialAlumniData = [
  {
    name: 'Muhammad Farhan',
    angkatan: '2020',
    currentRole: 'Edge AI Engineer',
    company: 'GoTo Financial / Gojek',
    category: 'AI / ML',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    project: 'Sistem Deteksi APD Realtime Jetson Nano & Smart CCTV Lab',
    linkedin: 'https://linkedin.com'
  },
  {
    name: 'Dwi Prasetyo',
    angkatan: '2021',
    currentRole: 'IoT Firmware Developer',
    company: 'Telkom Indonesia (IoT Div)',
    category: 'IoT / Embedded',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    project: 'Jaringan Sensor LoRaWAN Monitoring Kualitas Air Waduk',
    linkedin: 'https://linkedin.com'
  },
  {
    name: 'Alya Salsabila',
    angkatan: '2021',
    currentRole: 'Computer Vision Specialist',
    company: 'Paragon Technology and Innovation',
    category: 'AI / ML',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    project: 'Smart Sorting Kualitas Produk dengan Raspberry Pi & OpenCV',
    linkedin: 'https://linkedin.com'
  },
  {
    name: 'Rian Hidayat',
    angkatan: '2022',
    currentRole: 'Embedded Software Engineer',
    company: 'PT Solusi Teknologi Pintar',
    category: 'IoT / Embedded',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    project: 'Gateway Smart Metering Listrik Modbus & MQTT Gateway',
    linkedin: 'https://linkedin.com'
  },
  {
    name: 'Citra Kirana',
    angkatan: '2022',
    currentRole: 'Cloud & AI Infrastructure Dev',
    company: 'Shopee Indonesia',
    category: 'Software',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop',
    project: 'Backend MQTT Broker Telemetri Skala Besar KSM AIoT',
    linkedin: 'https://linkedin.com'
  }
];

export const initialInventoryData = [
  { id: 1, name: 'NVIDIA Jetson Orin Nano Dev Kit 8GB', category: 'Edge AI Device', total: 4, available: 3, borrowed: 1, condition: 'Prima' },
  { id: 2, name: 'Raspberry Pi 5 (8GB RAM)', category: 'Microcontroller / SBC', total: 6, available: 4, borrowed: 2, condition: 'Prima' },
  { id: 3, name: 'ESP32-CAM AI-Thinker Module', category: 'Microcontroller / Vision', total: 15, available: 11, borrowed: 4, condition: 'Prima' },
  { id: 4, name: 'STM32 Nucleo-F446RE Board', category: 'Embedded Dev Board', total: 8, available: 6, borrowed: 2, condition: 'Prima' },
  { id: 5, name: 'Dragino LoRaWAN Gateway LG01-N', category: 'Network / Gateway', total: 2, available: 2, borrowed: 0, condition: 'Prima' },
  { id: 6, name: 'RPLiDAR A1M8 360 Laser Scanner', category: 'Sensors / Navigation', total: 3, available: 2, borrowed: 1, condition: 'Prima' },
  { id: 7, name: 'Soldering Station Digital Quick 936A', category: 'Lab Hardware Tools', total: 4, available: 4, borrowed: 0, condition: 'Baik' },
  { id: 8, name: 'DHT22 + MPU6050 Sensor Bundle', category: 'Sensors', total: 20, available: 16, borrowed: 4, condition: 'Prima' }
];

export const initialFinanceData = [
  { id: 'TX-01', date: '2026-01-20', desc: 'Dana Hibah Riset Fakultas Ilmu Komputer', category: 'Hibah / Sponsor', type: 'Pemasukan', amount: 3500000, pic: 'Dzulfikri Adjmal', status: 'Disetujui' },
  { id: 'TX-02', date: '2026-01-24', desc: 'Pengadaan 4x Modul ESP32 & Breadboard Lab', category: 'Pengadaan Alat', type: 'Pengeluaran', amount: 480000, pic: 'Rahman Ilyas', status: 'Selesai' },
  { id: 'TX-03', date: '2026-02-02', desc: 'Iuran Kas Anggota Gelombang 1', category: 'Iuran Kas', type: 'Pemasukan', amount: 1000000, pic: 'Aniqah Raniah', status: 'Selesai' },
  { id: 'TX-04', date: '2026-02-10', desc: 'Konsumsi & Logistik Workshop TinyML AIoT', category: 'Konsumsi & Acara', type: 'Pengeluaran', amount: 650000, pic: 'Nicolas Debrito', status: 'Selesai' },
  { id: 'TX-05', date: '2026-02-18', desc: 'Komponen Sensor LiDAR & Akrilik Robotika', category: 'Pengadaan Alat', type: 'Pengeluaran', amount: 1020000, pic: 'Rahman Ilyas', status: 'Selesai' }
];

export const initialArchiveData = [
  { noSurat: 'B/001/UN61/KSM-AIOT/I/2026', sifat: 'B (Eksternal)', perihal: 'Permohonan Izin Peminjaman Lab IoT', tujuan: 'Ketua Jurusan Informatika FIK UPNVJ', date: '2026-01-15', signer: 'Dzulfikri Adjmal' },
  { noSurat: 'A/002/UN61/KSM-AIOT/I/2026', sifat: 'A (Internal)', perihal: 'Undangan Rapat Kerja Pengurus KSM AIoT', tujuan: 'Seluruh Pengurus BPH & Kadiv', date: '2026-01-22', signer: 'Syahla Nada Afifah' },
  { noSurat: 'SK/003/UN61/KSM-AIOT/II/2026', sifat: 'SK (Surat Keputusan)', perihal: 'Penetapan Panitia AIoT Hackathon 2026', tujuan: 'Anggota Panitia Terpilih', date: '2026-02-05', signer: 'Dzulfikri Adjmal' }
];

export const initialProjectsData = [
  {
    id: 'smart-hydroponic',
    title: 'Smart Hydroponic',
    category: 'iot',
    categoryLabel: 'IoT & Smart Agriculture',
    description: 'Sistem otomasi dan monitoring cerdas parameter nutrisi tanaman hidroponik (pH, TDS, suhu, kelembapan) berbasis ESP32, FastAPI, dan TimescaleDB.',
    image: '/smart-hydroponic.png',
    repoUrl: 'https://github.com/ksm-aiot-upnvj/smart-hydroponic',
    techStack: ['ESP32', 'FastAPI', 'TimescaleDB', 'Vue.js', 'CoAP', 'Docker']
  },
  {
    id: 'nexo',
    title: 'Nexo Assistant',
    category: 'bot',
    categoryLabel: 'Discord Bot & AI Agent',
    description: 'Asisten cerdas dan Discord bot interaktif KSM AIoT dengan integrasi Model Context Protocol (MCP), automasi tugas, dan query informasi organisasi.',
    image: '/response-nexo-mcp.png',
    repoUrl: 'https://github.com/ksm-aiot-upnvj/nexo',
    techStack: ['Python', 'Discord.py', 'MCP Protocol', 'LLM Agent', 'Tool Automation']
  }
];

