export const USER_PROFILE = {
  name: 'Budi Wicaksono',
  email: 'budi.w@email.com',
  initials: 'BW',
};

export const RECENT_SCANS = [
  {
    id: 'scan-1',
    merchant: 'Indomaret Malang',
    dateText: '16 Mar 2025 · 14:32',
    amount: 'Rp 87.500',
    category: 'Makanan',
  },
  {
    id: 'scan-2',
    merchant: 'Alfamart Soekarno Hatta',
    dateText: '15 Mar 2025 · 09:10',
    amount: 'Rp 45.000',
    category: 'Belanja',
  },
];

export const TRANSACTION_GROUPS = [
  {
    id: '16-maret',
    date: '16 Maret',
    items: [
      {
        id: 'txn-1',
        merchant: 'Indomaret Malang',
        meta: '14:32 · 3 item · scan',
        amount: 'Rp 87.500',
        category: 'Makanan',
      },
      {
        id: 'txn-2',
        merchant: 'Grab Car ke kantor',
        meta: '08:15 · manual',
        amount: 'Rp 25.000',
        category: 'Transport',
      },
    ],
  },
  {
    id: '15-maret',
    date: '15 Maret',
    items: [
      {
        id: 'txn-3',
        merchant: 'CGV Bioskop Malang',
        meta: '19:00 · 2 tiket',
        amount: 'Rp 120.000',
        category: 'Hiburan',
      },
      {
        id: 'txn-4',
        merchant: 'Apotek K-24',
        meta: '11:30 · 2 item · scan',
        amount: 'Rp 55.000',
        category: 'Kesehatan',
      },
      {
        id: 'txn-5',
        merchant: 'Alfamart Soekarno Hatta',
        meta: '09:10 · 5 item · scan',
        amount: 'Rp 45.000',
        category: 'Belanja',
      },
    ],
  },
];

export const DSS_RECOMMENDATIONS = [
  {
    id: 'dss-1',
    title: 'Mulai investasi reksa dana pasar uang',
    description:
      'Idle cash Anda bisa dioptimalkan dengan imbal hasil lebih tinggi dari tabungan biasa.',
  },
  {
    id: 'dss-2',
    title: 'Bangun dana darurat 6× pengeluaran',
    description:
      'Target dana darurat Anda Rp 14,7 juta. Saat ini estimasi sudah 60% tercapai.',
  },
  {
    id: 'dss-3',
    title: 'DCA 10% penghasilan setiap bulan',
    description:
      'Dollar cost averaging secara konsisten meningkatkan kekayaan jangka panjang.',
  },
];

