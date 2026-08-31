import { ComplaintCategory, ComplaintPriority, ComplaintStatus, GoaTaluka, Language, RoadType } from '../types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Branding & Header
    appName: 'NagrikSetu',
    appSubtitle: 'Public Works & Municipal Grievance Redressal Portal',
    portalTitle: 'Pothole & Road Grievance System',
    systemLive: 'System Live',
    officerDeskHeader: 'Municipal Officer Grievance Desk',
    citizenPortalHeader: 'NagrikSetu Grievance Portal',
    welcome: 'Welcome,',
    roleMode: 'Mode',
    switchRole: 'Switch',
    activeRole: 'Active Role:',
    jurisdiction: 'Jurisdiction',
    jurisdictionArea: 'North & South Goa',
    talukasActive: '8 Taluka Municipalities Active',
    citizenServices: 'Citizen Services',
    officerDesk: 'Municipal Officer Desk',

    // Auth & Navigation
    login: 'Log In',
    register: 'Register',
    logout: 'Log Out',
    signInPortal: 'Sign In to Portal',
    citizen: 'Citizen',
    officer: 'Municipal Officer',
    citizenDashboard: 'Citizen Dashboard',
    officerDashboard: 'Officer Dashboard',
    submitComplaint: 'Submit Complaint',
    complaintDetails: 'Complaint Details',
    complaintMap: 'Complaint Map',
    analytics: 'Analytics',
    backToDashboard: 'Back to Dashboard',
    review: 'Review',
    inspect: 'Inspect',
    track: 'Track',
    trackTicket: 'Direct Ticket Lookup',
    trackPlaceholder: 'e.g. GRF-2026-1042',
    noComplaintFoundWithId: 'No complaint found with this ID.',
    recentComplaints: 'Recent Complaints',
    viewAll: 'View All',
    legend: 'Legend',

    // Statuses
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',

    // Priorities
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    priority: 'Priority',
    highPriority: 'High Priority',
    mediumPriority: 'Medium Priority',
    lowPriority: 'Low Priority',

    // Form labels & Placeholders
    title: 'Complaint Title',
    titlePlaceholder: 'e.g., Deep pothole causing skidding near Colva circle',
    description: 'Detailed Description',
    descriptionPlaceholder: 'Describe the depth, location markers, traffic hazard, and road condition...',
    category: 'Category',
    selectCategory: 'Select category',
    location: 'Location & Taluka',
    selectTaluka: 'Select Taluka / Municipality',
    roadType: 'Road Type',
    selectRoadType: 'Select Road Type',
    landmark: 'Landmark / Street Address',
    landmarkPlaceholder: 'e.g., Near Kadamba Bus Stand, Opposite Police Station',
    roadName: 'Road / Street Name',
    roadNamePlaceholder: 'e.g., DB Road, NH 66 bypass',
    uploadPhoto: 'Upload Pothole Photo',
    uploadHint: 'Click or drag photo here. Clear photos speed up municipal response.',
    takePhotoWithCamera: 'Take Photo with Camera',
    openCamera: 'Open Live Camera',
    capturePhoto: 'Capture Photo',
    retakePhoto: 'Retake Photo',
    useCapturedPhoto: 'Use This Photo',
    flipCamera: 'Switch Camera',
    cameraPermissionError: 'Camera access denied or unavailable. Please grant camera permissions or upload an image file.',
    geoTagWatermark: 'Geo-Tag Stamp (Goa PWD, Taluka, GPS, Timestamp)',
    closeCamera: 'Close Camera',
    useCurrentLocation: 'Fetch Current GPS Location (Goa)',
    fetchingGps: 'Acquiring GPS coordinates...',
    gpsSuccess: 'GPS coordinates locked successfully.',
    smartCategoryPrediction: 'Smart Prediction',
    predictedCategoryNotice: 'AI Keyword Match:',
    nearbyWarningTitle: 'Similar Complaint Reported Nearby!',
    nearbyWarningDesc: 'A potential duplicate or nearby defect is already active in this area.',
    submitButton: 'Submit Pothole Report',
    submitting: 'Registering Grievance...',
    cancel: 'Cancel',
    reviewForm: 'Review Form',
    continueSubmitAnyway: 'Continue & Submit Anyway',
    existingComplaintId: 'Existing Complaint ID',
    currentStatus: 'Current Status',
    reportedLocation: 'Reported Location',
    duplicateWarningBanner: 'Duplicate check detected an active grievance matching this category and location.',
    duplicateNoticeText: 'If this is the same road defect, municipal squads may already have it scheduled. If this is a separate pothole or new damage, you can continue to register your report.',

    // Success Modal
    grievanceSubmittedSuccess: 'Grievance Registered Successfully!',
    complaintIdAssigned: 'Official Grievance Tracking ID:',
    shareNotice: 'Keep this ID for status tracking and SMS updates. PWD repair squad alerted.',
    viewComplaintStatus: 'View Live Ticket Status',
    reportAnother: 'Report Another Pothole',

    // Dashboard & Metrics
    totalComplaints: 'Total Complaints',
    pendingComplaints: 'Pending Action',
    inProgressComplaints: 'Work In Progress',
    resolvedComplaints: 'Resolved',
    avgResolutionTime: 'Avg. Resolution Time',
    searchComplaints: 'Search by title, ID, or landmark...',
    filterByStatus: 'Filter by Status',
    filterByTaluka: 'Filter by Taluka',
    filterByPriority: 'Filter by Priority',
    all: 'All',
    allTalukas: 'All Goa Districts & Talukas',
    allStatuses: 'All Statuses',
    allPriorities: 'All Priorities',
    myComplaints: 'My Reported Complaints',
    myReportedComplaints: 'My Reported Complaints',
    recentPortalComplaints: 'Recent Portal Complaints',
    allPortalComplaints: 'All Portal Complaints (Goa Wide)',
    noReportedComplaintsYet: 'No Complaints Reported Yet',
    noReportedComplaintsDesc: 'You have not filed any pothole or road damage grievances under this account yet.',
    browsePortalComplaints: 'Browse Public Complaints',
    viewMyReports: 'My Reports',
    yourActiveTickets: 'Your Reported Complaints',
    portalTotalGrievances: 'Goa Portal Total',
    noComplaintsFound: 'No complaints found matching your criteria.',
    reportNewPothole: '+ Report New Pothole',
    totalReports: 'Total Reports',
    actionRequired: 'Action required',
    workOrdersActive: 'Work orders active',
    avgDaysSLA: 'Avg. 2.8 days',
    goaLiveImpactMap: 'Goa Live Impact Map',
    hazardsTracked: 'georeferenced road hazards actively tracked',
    mapPinsHelper: 'Hover marker for preview • Click to open dossier',
    monsoonPreparedness: 'Monsoon Preparedness Protocol',
    monsoonText: 'Historical weather models project a 15% surge in pothole grievances across coastal highways during heavy downpours.',
    viewHotspots: 'View Hotspots',

    // Officer actions & Details
    officerActions: 'Officer Actions & Workflow',
    updateStatus: 'Update Status',
    assignDivision: 'Assign Division / Squad',
    selectDivision: 'Select Road Squad / Division',
    assignedOfficer: 'Assigned Officer Name',
    contractorSquad: 'Contractor / Repair Squad',
    addOfficialNote: 'Add Official Note / Progress Update',
    notePlaceholder: 'Enter inspection report, asphalt batch dispatch info, or work notes...',
    saveUpdate: 'Save & Notify Citizen',
    markAsResolved: 'Mark as Resolved',
    resolutionNotePlaceholder: 'Describe the patch work, asphalt compaction, or repair details...',
    attachResolutionPhoto: 'Attach Resolution Proof Photo',
    timelineAuditLog: 'Timeline & Official Audit Trail',
    addAuditNote: 'Post Official Note',
    citizenUploaded: 'Citizen Upload Photo',
    repairProofPhoto: 'Post-Repair Audit Photo',
    slaTargetHotmix: 'SLA Hot-Mix Standard: < 72 Hours',
    estimatedResolution: 'Estimated Resolution Time:',
    days: 'Days',
    dateReported: 'Date Reported:',
    lastUpdated: 'Last Updated:',
    citizenDetails: 'Citizen Contact',
    saveSuccessMsg: 'Status & Assignment updated successfully.',
    viewMapHeader: 'Complaint Locations Map',
    viewMapSub: 'Spatial overview of geo-tagged road grievance tickets across municipal circles',

    // Analytics View
    executiveAnalytics: 'Executive Municipal Analytics',
    analyticsInsights: 'Analytics & Grievance Insights',
    analyticsSub: 'Real-time analytics for defect intake, road squad dispatch speed, and resolution rates.',
    complaintsByCategory: 'Complaints by Category',
    complaintsByCategorySub: 'Distribution of reported defects across road infrastructure types',
    complaintsByStatus: 'Complaints by Status',
    complaintsByStatusSub: 'Current operational workflow pipeline and resolution status',
    grievancesByWard: 'Grievances by Municipal Ward / Taluka',
    prioritySeverity: 'Priority & Hazard Severity',
    publicWorksMandate: 'Public Works Mandate',
    mandateText: 'High-priority arterial potholes are assigned high-speed asphalt hot-mix repairs within 48 hours.',
    slaStandardNotice: 'SLA Standard: < 3.0 Days',
    resolutionRateLabel: 'Resolution Rate',

    // Map View
    mapTitle: 'Goa Road Grievance Geographic Map',
    mapSubtitle: 'Interactive location mapping of road defects across North and South Goa districts',
    filterByCircle: 'Filter Municipal Circle',
    inspectDossier: 'Inspect Grievance Dossier',

    // Demo Banner
    demoBannerTitle: 'Demo Mode Active',
    demoFlowText: 'Demo Flow: Citizen Submit Pothole → ID Generated → Officer Review & Assign → Citizen Live Tracking.',
    quickCitizenLogin: 'Citizen (citizen@test.com)',
    quickOfficerLogin: 'Officer (PIN Protected)',
    officerPinRequired: 'Officer PIN Required',
    officerSecurityClearance: 'Officer Security Clearance',
    officerPinHint: 'Authorized Goa PWD Officer PIN: 1234',
    officerPinSettings: 'Officer PIN Settings',
    resetOfficerPin: 'Reset Officer PIN',
    manageOfficerPin: 'Manage Security PIN',
    officerSecurityLevel: 'PWD Level 1 Clearance',
    resetToDefault: 'Reset to Default (1234)',
    demoTip: 'Click either account below to instantly test the citizen submission and officer resolution flow.',
  },
  hi: {
    // Branding & Header
    appName: 'नागरिकसेतु',
    appSubtitle: 'लोक निर्माण एवं नगर निगम शिकायत निवारण पोर्टल',
    portalTitle: 'सड़क गड्ढा एवं शिकायत प्रणाली',
    systemLive: 'सिस्टम लाइव',
    officerDeskHeader: 'नगर पालिका अधिकारी शिकायत पटल',
    citizenPortalHeader: 'नागरिकसेतु शिकायत पोर्टल',
    welcome: 'स्वागत है,',
    roleMode: 'मोड',
    switchRole: 'बदलें',
    activeRole: 'सक्रिय भूमिका:',
    jurisdiction: 'अधिकार क्षेत्र',
    officerPinSettings: 'अधिकारी पिन सेटिंग्स',
    resetOfficerPin: 'अधिकारी पिन रीसेट करें',
    manageOfficerPin: 'सुरक्षा पिन प्रबंधित करें',
    officerSecurityLevel: 'पीडब्ल्यूडी स्तर 1 क्लीयरेंस',
    resetToDefault: 'डिफ़ॉल्ट पर रीसेट करें (1234)',
    jurisdictionArea: 'उत्तर एवं दक्षिण गोवा',
    talukasActive: '8 तालुका नगर पालिकाएं सक्रिय',
    citizenServices: 'नागरिक सेवाएं',
    officerDesk: 'नगर पालिका अधिकारी डेस्क',

    // Auth & Navigation
    login: 'लॉग इन',
    register: 'पंजीकरण',
    logout: 'लॉग आउट',
    signInPortal: 'पोर्टल पर साइन इन करें',
    citizen: 'नागरिक',
    officer: 'नगर निगम अधिकारी',
    citizenDashboard: 'नागरिक डैशबोर्ड',
    officerDashboard: 'अधिकारी डैशबोर्ड',
    submitComplaint: 'शिकायत दर्ज करें',
    complaintDetails: 'शिकायत विवरण',
    complaintMap: 'शिकायत मानचित्र',
    analytics: 'एनालिटिक्स',
    backToDashboard: 'डैशबोर्ड पर वापस जाएं',
    review: 'समीक्षा करें',
    inspect: 'जांचें',
    track: 'ट्रैक करें',
    trackTicket: 'आईडी से शिकायत खोजें',
    trackPlaceholder: 'उदा. GRF-2026-1042',
    noComplaintFoundWithId: 'इस आईडी से कोई शिकायत नहीं मिली।',
    recentComplaints: 'हालिया शिकायतें',
    viewAll: 'सभी देखें',
    legend: 'संकेत सूची',

    // Statuses
    pending: 'लंबित',
    assigned: 'आवंटित',
    in_progress: 'प्रगति पर',
    resolved: 'समाधान हुआ',

    // Priorities
    low: 'निम्न',
    medium: 'मध्यम',
    high: 'उच्च',
    critical: 'अति-गंभीर',
    priority: 'प्राथमिकता',
    highPriority: 'उच्च प्राथमिकता',
    mediumPriority: 'मध्यम प्राथमिकता',
    lowPriority: 'निम्न प्राथमिकता',

    // Form labels & Placeholders
    title: 'शिकायत का शीर्षक',
    titlePlaceholder: 'उदा. कोलवा सर्कल के पास गहरा गड्ढा जिससे फिसलन हो रही है',
    description: 'विस्तृत विवरण',
    descriptionPlaceholder: 'गड्ढे की गहराई, स्थान संकेत, यातायात जोखिम और सड़क की स्थिति बताएं...',
    category: 'श्रेणी',
    selectCategory: 'श्रेणी चुनें',
    location: 'स्थान एवं तालुका',
    selectTaluka: 'तालुका / नगर पालिका चुनें',
    roadType: 'सड़क का प्रकार',
    selectRoadType: 'सड़क का प्रकार चुनें',
    landmark: 'लैंडमार्क / सड़क का पता',
    landmarkPlaceholder: 'उदा. कदंबा बस स्टैंड के पास, पुलिस स्टेशन के सामने',
    roadName: 'सड़क / मार्ग का नाम',
    roadNamePlaceholder: 'उदा. डीबी रोड, एनएच 66 बाईपास',
    uploadPhoto: 'गड्ढे की फोटो अपलोड करें',
    uploadHint: 'फोटो यहां खींचें या क्लिक करें। स्पष्ट फोटो से मरम्मत में तेजी आती है।',
    takePhotoWithCamera: 'कैमरे से सीधे फोटो खींचें',
    openCamera: 'लाइव कैमरा खोलें',
    capturePhoto: 'फोटो खींचें',
    retakePhoto: 'दोबारा खींचें',
    useCapturedPhoto: 'यह फोटो उपयोग करें',
    flipCamera: 'कैमरा बदलें',
    cameraPermissionError: 'कैमरा अनुमति अस्वीकृत या अनुपलब्ध है। कृपया कैमरा अनुमति दें या गैलरी से फोटो अपलोड करें।',
    geoTagWatermark: 'जियो-टैग स्टैम्प (गोवा पीडब्ल्यूडी, तालुका, जीपीएस, समय)',
    closeCamera: 'कैमरा बंद करें',
    useCurrentLocation: 'वर्तमान जीपीएस स्थान प्राप्त करें (गोवा)',
    fetchingGps: 'जीपीएस निर्देशांक प्राप्त हो रहे हैं...',
    gpsSuccess: 'जीपीएस स्थान सफलतापूर्वक दर्ज हुआ।',
    smartCategoryPrediction: 'स्मार्ट अनुमान',
    predictedCategoryNotice: 'कीवर्ड पहचान:',
    nearbyWarningTitle: 'आसपास पहले से समान शिकायत दर्ज है!',
    nearbyWarningDesc: 'इस क्षेत्र में पहले से एक गड्ढे या सड़क खराबी की शिकायत सक्रिय है।',
    submitButton: 'गड्ढे की रिपोर्ट दर्ज करें',
    submitting: 'शिकायत दर्ज हो रही है...',
    cancel: 'रद्द करें',
    reviewForm: 'फॉर्म की समीक्षा करें',
    continueSubmitAnyway: 'फिर भी आगे बढ़ें और सबमिट करें',
    existingComplaintId: 'मौजूदा शिकायत आईडी',
    currentStatus: 'वर्तमान स्थिति',
    reportedLocation: 'रिपोर्ट किया गया स्थान',
    duplicateWarningBanner: 'समान श्रेणी और स्थान से मेल खाती सक्रिय शिकायत मिली है।',
    duplicateNoticeText: 'यदि यह वही सड़क खराबी है, तो नगर पालिका टीम पहले से इसके लिए निर्धारित हो सकती है। यदि यह अलग गड्ढा है, तो आप रिपोर्ट दर्ज करना जारी रख सकते हैं।',

    // Success Modal
    grievanceSubmittedSuccess: 'शिकायत सफलतापूर्वक दर्ज की गई!',
    complaintIdAssigned: 'आधिकारिक शिकायत ट्रैकिंग आईडी:',
    shareNotice: 'स्थिति ट्रैकिंग और एसएमएस अपडेट के लिए इस आईडी को संभाल कर रखें। मरम्मत टीम को सूचित कर दिया गया है।',
    viewComplaintStatus: 'लाइव टिकट स्थिति देखें',
    reportAnother: 'एक और गड्ढा रिपोर्ट करें',

    // Dashboard & Metrics
    totalComplaints: 'कुल शिकायतें',
    pendingComplaints: 'लंबित कार्रवाई',
    inProgressComplaints: 'कार्य प्रगति पर',
    resolvedComplaints: 'समाधान हुआ',
    avgResolutionTime: 'औसत समाधान समय',
    searchComplaints: 'शीर्षक, आईडी या लैंडमार्क से खोजें...',
    filterByStatus: 'स्थिति अनुसार फ़िल्टर',
    filterByTaluka: 'तालुका अनुसार फ़िल्टर',
    filterByPriority: 'प्राथमिकता अनुसार फ़िल्टर',
    all: 'सभी',
    allTalukas: 'सभी गोवा जिले एवं तालुका',
    allStatuses: 'सभी स्थितियां',
    allPriorities: 'सभी प्राथमिकताएं',
    myComplaints: 'मेरी दर्ज शिकायतें',
    myReportedComplaints: 'मेरी दर्ज शिकायतें',
    recentPortalComplaints: 'हालिया पोर्टल शिकायतें',
    allPortalComplaints: 'पोर्टल की सभी शिकायतें (गोवा)',
    noReportedComplaintsYet: 'अभी तक कोई शिकायत दर्ज नहीं की गई',
    noReportedComplaintsDesc: 'आपने अभी तक अपने इस खाते से कोई गड्ढा या सड़क क्षति की शिकायत दर्ज नहीं की है।',
    browsePortalComplaints: 'सार्वजनिक शिकायतें देखें',
    viewMyReports: 'मेरी रिपोर्ट्स',
    yourActiveTickets: 'आपकी दर्ज शिकायतें',
    portalTotalGrievances: 'गोवा पोर्टल कुल',
    noComplaintsFound: 'कोई शिकायत नहीं मिली।',
    reportNewPothole: '+ नया गड्ढा रिपोर्ट करें',
    totalReports: 'कुल रिपोर्ट्स',
    actionRequired: 'कार्रवाई आवश्यक',
    workOrdersActive: 'कार्य आदेश सक्रिय',
    avgDaysSLA: 'औसत 2.8 दिन',
    goaLiveImpactMap: 'गोवा लाइव इम्पैक्ट मैप',
    hazardsTracked: 'सड़क गड्ढे लाइव ट्रैक किए जा रहे हैं',
    mapPinsHelper: 'पूर्वावलोकन के लिए मार्कर पर जाएं • फ़ाइल खोलने के लिए क्लिक करें',
    monsoonPreparedness: 'मानसून तत्परता प्रोटोकॉल',
    monsoonText: 'ऐतिहासिक मौसम मॉडल भारी बारिश के दौरान तटीय राजमार्गों पर गड्ढों की शिकायतों में 15% वृद्धि का अनुमान लगाते हैं।',
    viewHotspots: 'हॉटस्पॉट देखें',

    // Officer actions & Details
    officerActions: 'अधिकारी कार्रवाई एवं कार्यप्रवाह',
    updateStatus: 'स्थिति अपडेट करें',
    assignDivision: 'डिवीजन / टीम आवंटित करें',
    selectDivision: 'सड़क मरम्मत टीम चुनें',
    assignedOfficer: 'आवंटित अधिकारी का नाम',
    contractorSquad: 'ठेकेदार / मरम्मत टीम',
    addOfficialNote: 'आधिकारिक नोट / कार्य प्रगति जोड़ें',
    notePlaceholder: 'निरीक्षण रिपोर्ट, डामर सामग्री या कार्य प्रगति नोट दर्ज करें...',
    saveUpdate: 'सहेजें एवं नागरिक को सूचित करें',
    markAsResolved: 'समाधान के रूप में चिह्नित करें',
    resolutionNotePlaceholder: 'मरम्मत कार्य और डामरीकरण का विवरण दर्ज करें...',
    attachResolutionPhoto: 'मरम्मत के बाद की फोटो जोड़ें',
    timelineAuditLog: 'समयरेखा एवं आधिकारिक ऑडिट ट्रेल',
    addAuditNote: 'आधिकारिक नोट पोस्ट करें',
    citizenUploaded: 'नागरिक द्वारा अपलोड फोटो',
    repairProofPhoto: 'मरम्मत उपरांत सत्यापन फोटो',
    slaTargetHotmix: 'हॉट-मिक्स मानक: < 72 घंटे',
    estimatedResolution: 'अनुमानित समाधान समय:',
    days: 'दिन',
    dateReported: 'दर्ज करने की तिथि:',
    lastUpdated: 'अंतिम अपडेट:',
    citizenDetails: 'नागरिक संपर्क विवरण',
    saveSuccessMsg: 'स्थिति और आवंटन सफलतापूर्वक अपडेट किया गया।',
    viewMapHeader: 'शिकायत स्थान मानचित्र',
    viewMapSub: 'नगर पालिका क्षेत्रों में जियो-टैग्ड सड़क शिकायतों का स्थानिक नक्शा',

    // Analytics View
    executiveAnalytics: 'कार्यकारी नगर पालिका एनालिटिक्स',
    analyticsInsights: 'एनालिटिक्स एवं शिकायत विश्लेषण',
    analyticsSub: 'गड्ढों की शिकायत, मरम्मत दल रवानगी और समाधान दरों का लाइव विश्लेषण।',
    complaintsByCategory: 'श्रेणी अनुसार शिकायतें',
    complaintsByCategorySub: 'सड़क अवसंरचना प्रकारों में शिकायतों का वितरण',
    complaintsByStatus: 'स्थिति अनुसार शिकायतें',
    complaintsByStatusSub: 'वर्तमान परिचालन पाइपलाइन और समाधान स्थिति',
    grievancesByWard: 'नगर पालिका वार्ड / तालुका अनुसार शिकायतें',
    prioritySeverity: 'प्राथमिकता एवं जोखिम गंभीरता',
    publicWorksMandate: 'लोक निर्माण विभाग अधिदेश',
    mandateText: 'उच्च प्राथमिकता वाले मुख्य सड़क गड्ढों को 48 घंटों के भीतर उच्च गति हॉट-मिक्स डामर मरम्मत आवंटित की जाती है।',
    slaStandardNotice: 'मानक एसएलए: < 3.0 दिन',
    resolutionRateLabel: 'समाधान दर',

    // Map View
    mapTitle: 'गोवा सड़क शिकायत भौगोलिक मानचित्र',
    mapSubtitle: 'उत्तर एवं दक्षिण गोवा जिलों में सड़क गड्ढों का लाइव नक्शा',
    filterByCircle: 'नगर पालिका सर्कल फ़िल्टर करें',
    inspectDossier: 'शिकायत विवरण खोलें',

    // Demo Banner
    demoBannerTitle: 'डेमो मोड सक्रिय',
    demoFlowText: 'डेमो प्रवाह: नागरिक गड्ढा रिपोर्ट → आईडी सृजित → अधिकारी समीक्षा व आवंटन → नागरिक लाइव ट्रैकिंग।',
    quickCitizenLogin: 'नागरिक (citizen@test.com)',
    quickOfficerLogin: 'अधिकारी (पिन सुरक्षित)',
    officerPinRequired: 'अधिकारी पिन आवश्यक',
    officerSecurityClearance: 'अधिकारी सुरक्षा सत्यापन',
    officerPinHint: 'अधिकृत गोवा पीडब्ल्यूडी अधिकारी पिन: 1234',
    demoTip: 'नागरिक शिकायत दर्ज करने और अधिकारी समाधान प्रवाह की जांच के लिए नीचे दिए गए खातों पर क्लिक करें।',
  },
};

// Localized helper lookups for categories, road types, priorities, and statuses
export const localizedCategory = (cat: ComplaintCategory, lang: Language): string => {
  if (lang === 'en') return cat;
  switch (cat) {
    case 'Deep Pothole':
      return 'गहरा गड्ढा (Deep Pothole)';
    case 'Waterlogged Crater':
      return 'जलभराव वाला गड्ढा (Waterlogged Crater)';
    case 'Asphalt Surface Crack':
      return 'डामर की दरारें (Surface Crack)';
    case 'Road Edge Erosion':
      return 'सड़क के किनारे का क्षरण (Edge Erosion)';
    case 'Manhole / Drain Hazard':
      return 'मैनहोल / नाला खतरा (Drain Hazard)';
    case 'Trench / Utility Cut':
      return 'यूटिलिटी खुदाई / ट्रेंच (Utility Cut)';
    default:
      return cat;
  }
};

export const localizedRoadType = (rt: RoadType, lang: Language): string => {
  if (lang === 'en') return rt;
  switch (rt) {
    case 'National Highway':
      return 'राष्ट्रीय राजमार्ग (National Highway)';
    case 'State Highway':
      return 'राज्य राजमार्ग (State Highway)';
    case 'Major District Road':
      return 'प्रमुख जिला मार्ग (District Road)';
    case 'Village / Panchayat Road':
      return 'ग्रामीण / पंचायत सड़क (Village Road)';
    case 'Municipal / City Road':
      return 'नगर पालिका / शहर की सड़क (City Road)';
    default:
      return rt;
  }
};

export const localizedStatus = (status: ComplaintStatus, lang: Language): string => {
  const t = translations[lang];
  return t[status] || status;
};

export const localizedPriority = (priority: ComplaintPriority, lang: Language): string => {
  const t = translations[lang];
  return t[priority] || priority;
};
