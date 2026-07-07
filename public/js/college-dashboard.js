document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 College Dashboard loaded');
    
    let charts = {};
    let dashboardData = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    // DOM elements
    const collegeNameEl = document.getElementById('collegeName');
    const dashboardTitle = document.getElementById('dashboardTitle');
    const lastRefreshedEl = document.getElementById('lastRefreshed');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const kpiGrid = document.getElementById('kpiGrid');
    const insightsContainer = document.getElementById('insightsContainer');
    const trustPanel = document.getElementById('trustPanel');
    const qualityPanel = document.getElementById('qualityPanel');
    const dictionaryContainer = document.getElementById('dictionaryContainer');
    const privacyPanel = document.getElementById('privacyPanel');
    
    // Check authentication
    checkAuth();
    
    // Event listeners
    const refreshBtn = document.getElementById('refreshBtn');
    const retryBtn = document.getElementById('retryBtn');
    const exportBtn = document.getElementById('exportBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (refreshBtn) refreshBtn.addEventListener('click', loadDashboard);
    if (retryBtn) retryBtn.addEventListener('click', function() {
        retryCount = 0;
        loadDashboard();
    });
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`section-${section}`);
            if (target) target.classList.add('active');
        });
    });
    
    function checkAuth() {
        console.log('🔍 Checking authentication...');
        fetch('/api/auth/me', { credentials: 'include' })
            .then(response => {
                console.log('Auth response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Auth data:', data);
                if (!data.success || !data.data || !data.data.user) {
                    console.log('❌ Not authenticated, redirecting to login');
                    window.location.href = '/';
                    return;
                }
                const user = data.data.user;
                console.log('👤 User:', user);
                if (user.role !== 'college') {
                    if (user.role === 'admin') {
                        window.location.href = '/admin-dashboard.html';
                    } else {
                        window.location.href = '/';
                    }
                    return;
                }
                if (collegeNameEl) {
                    collegeNameEl.textContent = user.college_name || 'College';
                }
                if (dashboardTitle) {
                    dashboardTitle.textContent = 'College Value Dashboard';
                }
                console.log('🏫 College name:', collegeNameEl ? collegeNameEl.textContent : 'Unknown');
                loadDashboard();
            })
            .catch(error => {
                console.error('❌ Auth check error:', error);
                window.location.href = '/';
            });
    }
    
    function loadDashboard() {
        console.log('🔄 Loading dashboard data...');
        if (loadingState) loadingState.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        // Load all data
        Promise.all([
            fetch('/api/college/overview', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/funnel', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/application-trend', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/offer-distribution', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/department-performance', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/recruiter-trend', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/insights', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/data-trust', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/data-quality', { credentials: 'include' }).then(r => r.json()),
            fetch('/api/college/metric-dictionary', { credentials: 'include' }).then(r => r.json())
        ])
        .then(([overview, funnel, appTrend, offerDist, deptPerf, recTrend, insights, trust, quality, dictionary]) => {
            console.log('✅ All data loaded successfully');
            
            // Check if overview has data
            if (!overview.success) {
                console.error('❌ Overview data failed:', overview);
                throw new Error('Failed to load overview data');
            }
            
            dashboardData = {
                overview: overview.success ? overview.data : null,
                funnel: funnel.success ? funnel.data : null,
                appTrend: appTrend.success ? appTrend.data : [],
                offerDist: offerDist.success ? offerDist.data : [],
                deptPerf: deptPerf.success ? deptPerf.data : [],
                recTrend: recTrend.success ? recTrend.data : [],
                insights: insights.success ? insights.data : [],
                trust: trust.success ? trust.data : null,
                quality: quality.success ? quality.data : null,
                dictionary: dictionary.success ? dictionary.data : []
            };
            
            console.log('📊 Dashboard data prepared:', dashboardData);
            console.log('📊 Overview data:', dashboardData.overview);
            console.log('📊 Funnel data:', dashboardData.funnel);
            console.log('📊 App Trend data:', dashboardData.appTrend);
            console.log('📊 Offer Dist data:', dashboardData.offerDist);
            console.log('📊 Dept Perf data:', dashboardData.deptPerf);
            console.log('📊 Rec Trend data:', dashboardData.recTrend);
            console.log('📊 Insights data:', dashboardData.insights);
            console.log('📊 Trust data:', dashboardData.trust);
            console.log('📊 Quality data:', dashboardData.quality);
            console.log('📊 Dictionary data:', dashboardData.dictionary);
            
            if (loadingState) loadingState.style.display = 'none';
            
            // Render everything
            renderKPIs(dashboardData.overview);
            renderCharts(dashboardData);
            renderInsights(dashboardData.insights);
            renderTrust(dashboardData.trust);
            renderQuality(dashboardData.quality);
            renderDictionary(dashboardData.dictionary);
            renderPrivacy();
            
            updateLastRefreshed();
            retryCount = 0;
        })
        .catch(error => {
            console.error('❌ Error loading dashboard:', error);
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log(`🔄 Retrying... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => loadDashboard(), 2000);
            } else {
                if (loadingState) loadingState.style.display = 'none';
                if (errorState) errorState.style.display = 'flex';
            }
        });
    }
    
    function renderKPIs(data) {
        if (!data) {
            console.warn('⚠️ No overview data for KPIs');
            if (kpiGrid) {
                kpiGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #718096;">No data available</div>';
            }
            return;
        }
        
        console.log('📊 Rendering KPIs:', data);
        
        const kpis = [
            { label: 'Total Students', value: data.totalStudents || 0, source: 'students table' },
            { label: 'Placement Rate', value: (data.placementRate || 0) + '%', source: 'students table' },
            { label: 'Student Engagement', value: (data.engagementRate || 0) + '%', source: 'students & applications' },
            { label: 'Profile Completion', value: (data.profileCompletionRate || 0) + '%', source: 'students table' },
            { label: 'Skill Readiness', value: (data.skillReadinessRate || 0) + '%', source: 'students table' },
            { label: 'Total Applications', value: data.totalApplications || 0, source: 'applications table' },
            { label: 'Total Offers', value: data.totalOffers || 0, source: 'offers table' },
            { label: 'Offer Acceptance', value: (data.offerAcceptanceRate || 0) + '%', source: 'offers table' },
            { label: 'Active Recruiters', value: data.activeRecruiters || 0, source: 'recruiter_activities' },
            { label: 'Average Salary', value: '₹' + (data.averageSalary || 0) + ' LPA', source: 'offers table' }
        ];
        
        if (!kpiGrid) {
            console.error('❌ KPI grid element not found');
            return;
        }
        
        kpiGrid.innerHTML = '';
        kpis.forEach(kpi => {
            const card = document.createElement('div');
            card.className = 'kpi-card';
            
            // Add status badge for key metrics
            let badge = '';
            if (kpi.label === 'Placement Rate') {
                badge = getBadge(data.placementRate, 75, 60);
            } else if (kpi.label === 'Student Engagement') {
                badge = getBadge(data.engagementRate, 85, 70);
            } else if (kpi.label === 'Skill Readiness') {
                badge = getBadge(data.skillReadinessRate, 85, 70);
            } else if (kpi.label === 'Offer Acceptance') {
                badge = getBadge(data.offerAcceptanceRate, 85, 70);
            }
            
            card.innerHTML = `
                <div class="kpi-label">
                    ${kpi.label}
                    ${badge}
                </div>
                <div class="kpi-value">${kpi.value}</div>
                <div class="kpi-source">Source: ${kpi.source}</div>
            `;
            kpiGrid.appendChild(card);
        });
    }
    
    function getBadge(value, healthy, watch) {
        let status = 'Critical';
        let statusClass = 'critical';
        if (value >= healthy) {
            status = 'Healthy';
            statusClass = 'healthy';
        } else if (value >= watch) {
            status = 'Watch';
            statusClass = 'watch';
        }
        return `<span class="kpi-badge badge-${statusClass}">${status}</span>`;
    }
    
    function renderCharts(data) {
        console.log('📊 Rendering charts...');
        console.log('📊 Chart data received:', {
            funnel: data.funnel,
            appTrend: data.appTrend,
            offerDist: data.offerDist,
            deptPerf: data.deptPerf,
            recTrend: data.recTrend
        });
        
        // Destroy existing charts
        Object.values(charts).forEach(c => { 
            if (c) { 
                try { c.destroy(); } catch(e) {} 
            } 
        });
        charts = {};
        
        // 1. Funnel Chart (Overview section)
        if (data.funnel) {
            const canvas = document.getElementById('funnelChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    const funnelData = data.funnel;
                    console.log('📊 Funnel data for chart:', funnelData);
                    charts.funnel = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Total', 'Active', 'Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'],
                            datasets: [{
                                label: 'Students',
                                data: [
                                    funnelData.totalStudents || 0,
                                    funnelData.activeStudents || 0,
                                    funnelData.applicants || 0,
                                    funnelData.shortlisted || 0,
                                    funnelData.interviewed || 0,
                                    funnelData.offered || 0,
                                    funnelData.hired || 0
                                ],
                                backgroundColor: ['#667eea', '#764ba2', '#48bb78', '#4299e1', '#ed8936', '#f56565', '#38a169']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y + ' students';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Students'
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Funnel chart created');
                } catch (e) {
                    console.error('❌ Error creating funnel chart:', e);
                }
            } else {
                console.warn('⚠️ funnelChart canvas not found');
            }
        } else {
            console.warn('⚠️ No funnel data available');
        }
        
        // 2. Application Trend Chart
        if (data.appTrend && data.appTrend.length > 0) {
            const canvas = document.getElementById('applicationTrendChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    console.log('📊 App Trend data for chart:', data.appTrend);
                    charts.appTrend = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.appTrend.map(d => d.month || ''),
                            datasets: [{
                                label: 'Applications',
                                data: data.appTrend.map(d => d.applications || 0),
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                                legend: { display: true }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Applications'
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Application trend chart created');
                } catch (e) {
                    console.error('❌ Error creating application trend chart:', e);
                }
            } else {
                console.warn('⚠️ applicationTrendChart canvas not found');
            }
        } else {
            console.warn('⚠️ No application trend data available');
        }
        
        // 3. Funnel Full Chart (Placement Funnel section)
        if (data.funnel) {
            const canvas = document.getElementById('funnelChartFull');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    const funnelData = data.funnel;
                    charts.funnelFull = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Total', 'Active', 'Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'],
                            datasets: [{
                                label: 'Placement Funnel',
                                data: [
                                    funnelData.totalStudents || 0,
                                    funnelData.activeStudents || 0,
                                    funnelData.applicants || 0,
                                    funnelData.shortlisted || 0,
                                    funnelData.interviewed || 0,
                                    funnelData.offered || 0,
                                    funnelData.hired || 0
                                ],
                                backgroundColor: ['#667eea', '#764ba2', '#48bb78', '#4299e1', '#ed8936', '#f56565', '#38a169']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y + ' students';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Students'
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Funnel full chart created');
                } catch (e) {
                    console.error('❌ Error creating funnel full chart:', e);
                }
            } else {
                console.warn('⚠️ funnelChartFull canvas not found');
            }
        }
        
        // 4. Department Performance Chart
        if (data.deptPerf && data.deptPerf.length > 0) {
            const canvas = document.getElementById('departmentChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    console.log('📊 Dept Perf data for chart:', data.deptPerf);
                    charts.deptPerf = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: data.deptPerf.map(d => d.department || ''),
                            datasets: [{
                                label: 'Placement Rate (%)',
                                data: data.deptPerf.map(d => d.placementRate || 0),
                                backgroundColor: 'rgba(102, 126, 234, 0.8)'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            indexAxis: 'y',
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.x + '% placement rate';
                                        }
                                    }
                                }
                            },
                            scales: { 
                                x: { 
                                    beginAtZero: true, 
                                    max: 100,
                                    title: {
                                        display: true,
                                        text: 'Placement Rate (%)'
                                    }
                                } 
                            }
                        }
                    });
                    console.log('✅ Department chart created');
                } catch (e) {
                    console.error('❌ Error creating department chart:', e);
                }
            } else {
                console.warn('⚠️ departmentChart canvas not found');
            }
        } else {
            console.warn('⚠️ No department performance data available');
        }
        
        // 5. Offer Distribution Chart
        if (data.offerDist && data.offerDist.length > 0) {
            const canvas = document.getElementById('offerDistributionChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    const colors = { 
                        accepted: '#48bb78', 
                        pending: '#ed8936', 
                        rejected: '#fc8181', 
                        expired: '#a0aec0' 
                    };
                    const labels = data.offerDist.map(d => d.offer_status || '');
                    const values = data.offerDist.map(d => d.count || 0);
                    const backgroundColors = labels.map(l => colors[l] || '#a0aec0');
                    
                    console.log('📊 Offer Dist data for chart:', data.offerDist);
                    charts.offerDist = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                            datasets: [{
                                data: values,
                                backgroundColor: backgroundColors
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { 
                                legend: { 
                                    position: 'bottom',
                                    labels: {
                                        padding: 20
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                            return context.parsed + ' offers (' + percentage + '%)';
                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Offer distribution chart created');
                } catch (e) {
                    console.error('❌ Error creating offer distribution chart:', e);
                }
            } else {
                console.warn('⚠️ offerDistributionChart canvas not found');
            }
        } else {
            console.warn('⚠️ No offer distribution data available');
        }
        
        // 6. Recruiter Trend Chart
        if (data.recTrend && data.recTrend.length > 0) {
            const canvas = document.getElementById('recruiterTrendChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    console.log('📊 Rec Trend data for chart:', data.recTrend);
                    charts.recTrend = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.recTrend.map(d => d.month || ''),
                            datasets: [
                                {
                                    label: 'Activities',
                                    data: data.recTrend.map(d => d.activities || 0),
                                    borderColor: '#4299e1',
                                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                                    fill: true,
                                    tension: 0.4,
                                    yAxisID: 'y'
                                },
                                {
                                    label: 'Recruiters',
                                    data: data.recTrend.map(d => d.recruiters || 0),
                                    borderColor: '#48bb78',
                                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                                    fill: true,
                                    tension: 0.4,
                                    yAxisID: 'y1'
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                                legend: { 
                                    position: 'top',
                                    labels: {
                                        padding: 20
                                    }
                                }
                            },
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    position: 'left',
                                    title: { 
                                        display: true, 
                                        text: 'Activities',
                                        color: '#4299e1'
                                    }
                                },
                                y1: { 
                                    beginAtZero: true, 
                                    position: 'right', 
                                    grid: { drawOnChartArea: false },
                                    title: { 
                                        display: true, 
                                        text: 'Recruiters',
                                        color: '#48bb78'
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Recruiter trend chart created');
                } catch (e) {
                    console.error('❌ Error creating recruiter trend chart:', e);
                }
            } else {
                console.warn('⚠️ recruiterTrendChart canvas not found');
            }
        } else {
            console.warn('⚠️ No recruiter trend data available');
        }
        
        // 7. Hiring Outcomes Chart
        if (data.funnel) {
            const canvas = document.getElementById('hiringOutcomesChart');
            if (canvas) {
                try {
                    const ctx = canvas.getContext('2d');
                    const funnelData = data.funnel;
                    charts.hiringOutcomes = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Shortlisted', 'Interviewed', 'Offered', 'Hired'],
                            datasets: [{
                                label: 'Students',
                                data: [
                                    funnelData.shortlisted || 0,
                                    funnelData.interviewed || 0,
                                    funnelData.offered || 0,
                                    funnelData.hired || 0
                                ],
                                backgroundColor: ['#4299e1', '#ed8936', '#f56565', '#38a169']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y + ' students';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Students'
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Hiring outcomes chart created');
                } catch (e) {
                    console.error('❌ Error creating hiring outcomes chart:', e);
                }
            } else {
                console.warn('⚠️ hiringOutcomesChart canvas not found');
            }
        }
        
        console.log('✅ All charts processing complete');
    }
    
    function renderInsights(insights) {
        if (!insightsContainer) {
            console.error('❌ Insights container not found');
            return;
        }
        
        if (!insights || insights.length === 0) {
            insightsContainer.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No insights available.</p>';
            return;
        }
        
        console.log('📊 Rendering insights:', insights);
        insightsContainer.innerHTML = '';
        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            const color = insight.status === 'Healthy' ? '#48bb78' : insight.status === 'Watch' ? '#d69e2e' : '#e53e3e';
            const bgColor = insight.status === 'Healthy' ? '#f0fff4' : insight.status === 'Watch' ? '#fffff0' : '#fff5f5';
            card.style.borderLeft = `4px solid ${color}`;
            card.style.backgroundColor = bgColor;
            card.innerHTML = `
                <div class="insight-header">
                    <span class="insight-metric">${insight.metric}</span>
                    <span class="insight-value">
                        <span style="background: ${color}20; color: ${color}; padding: 2px 12px; border-radius: 12px; font-weight: 600;">${insight.value}</span>
                        ${insight.status}
                    </span>
                </div>
                <div class="insight-recommendation">💡 ${insight.recommendation}</div>
            `;
            insightsContainer.appendChild(card);
        });
    }
    
    function renderTrust(trust) {
        if (!trustPanel) {
            console.error('❌ Trust panel not found');
            return;
        }
        
        if (!trust) {
            trustPanel.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No trust data available.</p>';
            return;
        }
        
        console.log('📊 Rendering trust:', trust);
        const statusClass = trust.freshnessStatus ? trust.freshnessStatus.toLowerCase() : 'no-data';
        trustPanel.innerHTML = `
            <div class="trust-panel">
                <div class="trust-item">
                    <div class="trust-label">📅 Last Event Received</div>
                    <div class="trust-value">${trust.latestEvent ? new Date(trust.latestEvent.timestamp).toLocaleString() : 'No events'}</div>
                    <div style="font-size: 12px; color: #718096; margin-top: 4px;">${trust.latestEvent ? trust.latestEvent.eventName : ''}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">⏱️ Data Age</div>
                    <div class="trust-value">${trust.dataAge || 'Unknown'}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">📊 Total Events Processed</div>
                    <div class="trust-value">${trust.totalEventsProcessed || 0}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">🟢 Freshness Status</div>
                    <div class="trust-value trust-status ${statusClass}">${trust.freshnessStatus || 'No data'}</div>
                </div>
            </div>
        `;
    }
    
    function renderQuality(quality) {
        if (!qualityPanel) {
            console.error('❌ Quality panel not found');
            return;
        }
        
        if (!quality) {
            qualityPanel.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No quality data available.</p>';
            return;
        }
        
        console.log('📊 Rendering quality:', quality);
        const allPassed = quality.failedChecks === 0;
        qualityPanel.innerHTML = `
            <div class="quality-panel">
                <div style="text-align: center; margin-bottom: 16px;">
                    <div class="quality-score" style="color: ${quality.qualityScore >= 80 ? '#38a169' : quality.qualityScore >= 60 ? '#d69e2e' : '#e53e3e'}">
                        ${quality.qualityScore || 0}%
                    </div>
                    <div style="font-size: 14px; color: #718096;">
                        ${quality.passedChecks || 0} of ${quality.totalChecks || 0} checks passed
                    </div>
                    ${allPassed ? '<div style="color: #38a169; font-weight: 500; margin-top: 8px;">✅ All critical data quality checks passed.</div>' : ''}
                </div>
                <div class="quality-checks">
                    ${(quality.checks || []).map(check => `
                        <div class="quality-check ${check.passed ? 'passed' : 'failed'}">
                            <span>${check.passed ? '✅' : '❌'} ${check.name}</span>
                            <span>${check.details}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    function renderDictionary(dictionary) {
        if (!dictionaryContainer) {
            console.error('❌ Dictionary container not found');
            return;
        }
        
        if (!dictionary || dictionary.length === 0) {
            dictionaryContainer.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No dictionary entries available.</p>';
            return;
        }
        
        console.log('📊 Rendering dictionary:', dictionary.length, 'entries');
        dictionaryContainer.innerHTML = '';
        dictionary.forEach(item => {
            const div = document.createElement('div');
            div.className = 'dictionary-item';
            div.innerHTML = `
                <h4>📊 ${item.metric}</h4>
                <p><strong>Definition:</strong> ${item.definition}</p>
                <p><strong>Formula:</strong> ${item.formula}</p>
                <p class="source"><strong>Source:</strong> ${item.source}</p>
                <p><strong>Decision:</strong> ${item.decision}</p>
            `;
            dictionaryContainer.appendChild(div);
        });
    }
    
    function renderPrivacy() {
        if (!privacyPanel) {
            console.error('❌ Privacy panel not found');
            return;
        }
        
        const collegeName = collegeNameEl ? collegeNameEl.textContent : 'Unknown';
        privacyPanel.innerHTML = `
            <div class="privacy-panel">
                <div class="privacy-item">
                    <span class="privacy-label">👤 Logged-in Role</span>
                    <span class="privacy-value">College Officer</span>
                </div>
                <div class="privacy-item">
                    <span class="privacy-label">🏫 Authorized College</span>
                    <span class="privacy-value">${collegeName}</span>
                </div>
                <div class="privacy-item">
                    <span class="privacy-label">📊 Data Scope</span>
                    <span class="privacy-value">${collegeName} records only</span>
                </div>
                <div class="privacy-item">
                    <span class="privacy-label">🔒 Isolation Status</span>
                    <span class="privacy-value" style="color: #38a169; font-weight: 600;">✅ Enforced server-side</span>
                </div>
                <div style="margin-top: 16px; padding: 16px; background: #f7fafc; border-radius: 6px; font-size: 14px; color: #4a5568; line-height: 1.6;">
                    <p><strong>How it works:</strong> College users never send or select a college_id for analytics access. 
                    The server derives the authorized college_id from the authenticated session and applies it to every college query. 
                    This prevents one college from requesting another college's data by changing URLs, query parameters, or frontend values.</p>
                </div>
            </div>
        `;
    }
    
    function updateLastRefreshed() {
        const now = new Date();
        if (lastRefreshedEl) {
            lastRefreshedEl.textContent = `Last refreshed: ${now.toLocaleString()}`;
        }
    }
    
    function exportCSV() {
        console.log('📤 Exporting CSV...');
        fetch('/api/export/college-report', { credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Export failed');
                    });
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const collegeName = collegeNameEl ? collegeNameEl.textContent : 'college';
                a.download = `college-report-${collegeName}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                console.log('✅ CSV exported successfully');
            })
            .catch(error => {
                console.error('❌ Export error:', error);
                alert('Failed to export report: ' + error.message);
            });
    }
    
    function logout() {
        console.log('👋 Logging out...');
        fetch('/api/auth/logout', { 
            method: 'POST', 
            credentials: 'include' 
        })
        .then(() => {
            window.location.href = '/';
        })
        .catch(() => {
            window.location.href = '/';
        });
    }
});