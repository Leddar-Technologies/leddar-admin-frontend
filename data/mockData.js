export const commissionSettings = {
  adminCommissionPercent: 28,
  artisanStage1Percent: 36,
  artisanStage2Percent: 36,
  sampleFlatFee: 30000,
  sampleAdminCommissionPercent: 30,
};

export const brands = [
  { id: 1, businessName: 'Zara Couture', productType: 'Bags', email: 'zara@example.com', whatsapp: '+2348012345678', kycStatus: 'Verified', status: 'Active', registrationDate: '2026-03-15' },
  { id: 2, businessName: 'Lagos Leather Co', productType: 'Wallets', email: 'lagos@example.com', whatsapp: '+2348023456789', kycStatus: 'Pending', status: 'Pending Approval', registrationDate: '2026-03-20' },
  { id: 3, businessName: 'Abuja Brands', productType: 'Belts', email: 'abuja@example.com', whatsapp: '+2348034567890', kycStatus: 'Verified', status: 'Active', registrationDate: '2026-02-10' },
  { id: 4, businessName: 'Style House NG', productType: 'Shoes', email: 'style@example.com', whatsapp: '+2348045678901', kycStatus: 'Failed', status: 'Suspended', registrationDate: '2026-01-05' },
];

export const artisans = [
  { id: 1, fullName: 'Emeka Okafor', specialty: 'Bags & Wallets', whatsapp: '+2348056789012', bankAccount: '****3456', kycStatus: 'Verified', status: 'Active', registrationDate: '2026-02-18', portfolio: ['/mock/portfolio1.jpg', '/mock/portfolio2.jpg', '/mock/portfolio3.jpg'] },
  { id: 2, fullName: 'Chidi Nwosu', specialty: 'Belts & Shoes', whatsapp: '+2348067890123', bankAccount: '****7890', kycStatus: 'Pending', status: 'Pending Approval', registrationDate: '2026-03-02', portfolio: ['/mock/portfolio4.jpg', '/mock/portfolio5.jpg', '/mock/portfolio6.jpg'] },
  { id: 3, fullName: 'Amina Yusuf', specialty: 'Shoes & Accessories', whatsapp: '+2348071112233', bankAccount: '****2244', kycStatus: 'Verified', status: 'Active', registrationDate: '2026-01-22', portfolio: ['/mock/portfolio7.jpg', '/mock/portfolio8.jpg', '/mock/portfolio9.jpg'] },
];

export const quotes = [
  { id: 'QTE-001', brandName: 'Zara Couture', requestType: 'Sample Request', productType: 'Bags', date: '2026-04-01', status: 'Completed', orderId: 'ORD-001' },
  { id: 'QTE-002', brandName: 'Abuja Brands', requestType: 'Production Request', productType: 'Belts', date: '2026-04-04', status: 'Awaiting Production Pricing', orderId: 'ORD-002' },
  { id: 'QTE-003', brandName: 'Lagos Leather Co', requestType: 'Sample Request', productType: 'Wallets', date: '2026-04-07', status: 'Quote Sent', orderId: 'ORD-003' },
  { id: 'QTE-004', brandName: 'Style House NG', requestType: 'Production Request', productType: 'Shoes', date: '2026-04-08', status: 'Pending', orderId: 'ORD-004' },
];

export const orders = [
  { id: 'ORD-001', brand: 'Zara Couture', artisan: 'Emeka Okafor', orderType: 'Sample', productType: 'Bags', quantity: 1, fullAmount: 30000, status: 'Sample Approved', commissionRate: 30, artisanStage1Rate: 0, artisanStage2Rate: 70, date: '2026-04-01' },
  { id: 'ORD-002', brand: 'Abuja Brands', artisan: 'Emeka Okafor', orderType: 'Production', productType: 'Belts', quantity: 50, fullAmount: 250000, status: 'In Production', commissionRate: 28, artisanStage1Rate: 36, artisanStage2Rate: 36, date: '2026-04-05' },
  { id: 'ORD-003', brand: 'Lagos Leather Co', artisan: 'Amina Yusuf', orderType: 'Sample', productType: 'Wallets', quantity: 1, fullAmount: 30000, status: 'Video Sent', commissionRate: 30, artisanStage1Rate: 0, artisanStage2Rate: 70, date: '2026-04-09' },
  { id: 'ORD-004', brand: 'Style House NG', artisan: 'Amina Yusuf', orderType: 'Production', productType: 'Shoes', quantity: 40, fullAmount: 420000, status: 'Quote Approved', commissionRate: 28, artisanStage1Rate: 36, artisanStage2Rate: 36, date: '2026-04-10' },
];

export const orderTimelines = {
  'ORD-001': [
    { status: 'Flat Fee Paid', note: 'Brand paid sample flat fee.', at: '2026-04-01T09:30:00Z' },
    { status: 'Sample in Production', note: 'Artisan started sample work.', at: '2026-04-02T11:00:00Z' },
    { status: 'Video Sent', note: 'Sample video forwarded to brand.', at: '2026-04-03T16:10:00Z' },
    { status: 'Sample Approved', note: 'Brand approved sample.', at: '2026-04-04T10:45:00Z' },
  ],
  'ORD-002': [
    { status: 'Quote Approved', note: 'Brand approved production quote.', at: '2026-04-05T08:10:00Z' },
    { status: 'In Production', note: 'Production commenced.', at: '2026-04-06T13:00:00Z' },
  ],
};

export const jobs = [
  { id: 'JOB-001', jobType: 'Sample', brand: 'Zara Couture', assignedArtisan: 'Emeka Okafor', product: 'Bags', deadline: '2026-04-12', status: 'Video Uploaded', orderId: 'ORD-001', hasVideo: true },
  { id: 'JOB-002', jobType: 'Production', brand: 'Abuja Brands', assignedArtisan: 'Emeka Okafor', product: 'Belts', deadline: '2026-04-28', status: 'In Progress', orderId: 'ORD-002', hasVideo: false },
  { id: 'JOB-003', jobType: 'Production', brand: 'Style House NG', assignedArtisan: 'Amina Yusuf', product: 'Shoes', deadline: '2026-04-30', status: 'Assigned', orderId: 'ORD-004', hasVideo: false },
];

export const payments = [
  { id: 'PAY-001', orderId: 'ORD-001', brand: 'Zara Couture', artisan: 'Emeka Okafor', type: 'Sample', fullAmount: 30000, escrowStatus: 'Held', invoiceStatus: 'Paid', stage1Released: false, stage2Released: false },
  { id: 'PAY-002', orderId: 'ORD-002', brand: 'Abuja Brands', artisan: 'Emeka Okafor', type: 'Production', fullAmount: 250000, escrowStatus: 'Partially Released', invoiceStatus: 'Paid', stage1Released: true, stage2Released: false },
  { id: 'PAY-003', orderId: 'ORD-004', brand: 'Style House NG', artisan: 'Amina Yusuf', type: 'Production', fullAmount: 420000, escrowStatus: 'Held', invoiceStatus: 'Pending', stage1Released: false, stage2Released: false },
  { id: 'PAY-004', orderId: 'ORD-003', brand: 'Lagos Leather Co', artisan: 'Amina Yusuf', type: 'Sample', fullAmount: 30000, escrowStatus: 'Released', invoiceStatus: 'Paid', stage1Released: false, stage2Released: true },
];

export const notifications = [
  { id: 1, recipient: 'Lagos Leather Co', audience: 'Brand', channel: 'Email', triggerEvent: 'Brand Approval', messagePreview: 'Your account has been approved.', timestamp: '2026-04-10T12:45:00Z', status: 'Sent' },
  { id: 2, recipient: 'Zara Couture', audience: 'Brand', channel: 'WhatsApp', triggerEvent: 'Order Status Change', messagePreview: 'Order moved to Sample in Production.', timestamp: '2026-04-04T10:22:00Z', status: 'Sent' },
  { id: 3, recipient: 'Abuja Brands', audience: 'Brand', channel: 'Email', triggerEvent: 'Sample Flat Fee Paid', messagePreview: 'Sample flat fee has been received.', timestamp: '2026-04-05T09:10:00Z', status: 'Sent' },
  { id: 4, recipient: 'Emeka Okafor', audience: 'Artisan', channel: 'WhatsApp', triggerEvent: 'Job Assignment', messagePreview: 'You have been assigned a new job.', timestamp: '2026-04-05T14:05:00Z', status: 'Sent' },
  { id: 5, recipient: 'Emeka Okafor', audience: 'Artisan', channel: 'WhatsApp', triggerEvent: 'Stage 1 Release', messagePreview: 'Stage 1 payment has been released.', timestamp: '2026-04-08T11:14:00Z', status: 'Sent' },
  { id: 6, recipient: 'Amina Yusuf', audience: 'Artisan', channel: 'Email', triggerEvent: 'Stage 2 Release', messagePreview: 'Final payment has been released.', timestamp: '2026-04-09T16:50:00Z', status: 'Sent' },
  { id: 7, recipient: 'System', audience: 'System', channel: 'Email', triggerEvent: 'Commission Update', messagePreview: 'Commission settings were modified.', timestamp: '2026-04-10T17:20:00Z', status: 'Sent' },
  { id: 8, recipient: 'Style House NG', audience: 'Brand', channel: 'WhatsApp', triggerEvent: 'Order Status Change', messagePreview: 'Production pricing has been sent.', timestamp: '2026-04-12T08:41:00Z', status: 'Failed' },
];

export const recentActivities = [
  { id: 1, icon: 'UserCheck', title: 'Brand account approved', detail: 'Lagos Leather Co has been verified.', timestamp: '5 mins ago' },
  { id: 2, icon: 'ClipboardCheck', title: 'Production quote approved', detail: 'Abuja Brands approved quote for ORD-002.', timestamp: '24 mins ago' },
  { id: 3, icon: 'Package', title: 'Sample moved to video review', detail: 'JOB-001 has uploaded a sample video.', timestamp: '1 hour ago' },
  { id: 4, icon: 'Wallet', title: 'Stage 1 released', detail: 'Emeka Okafor received Stage 1 payment.', timestamp: '3 hours ago' },
  { id: 5, icon: 'Bell', title: 'Notification retry queued', detail: 'One failed WhatsApp notification detected.', timestamp: '5 hours ago' },
  { id: 6, icon: 'Settings', title: 'Commission settings reviewed', detail: 'Admin reviewed current commission split.', timestamp: 'Yesterday' },
];

export const dashboardStats = {
  totalBrands: 12,
  totalArtisans: 8,
  activeOrders: 5,
  pendingApprovals: 3,
  totalEscrowBalance: 840000,
  totalCommissionEarned: 126000,
};
