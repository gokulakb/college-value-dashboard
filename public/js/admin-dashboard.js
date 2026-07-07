document.addEventListener('DOMContentLoaded', function() {
    // State
    let dashboardData = null;
    let charts = {};
    
    // DOM elements
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const retryBtn = document.getElementById('retryBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const lastRefreshedEl = document.getElementById('lastRefreshed');
    const sections = document.querySelectorAll('.dashboard-section');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    // Check authentication
    checkAuth();
    
    // Event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateTo(section);
        });
    });
    
    retryBtn.addEventListener('click', loadDashboard);
    refreshBtn.addEventListener('click', loadDashboard);
    logoutBtn.addEventListener('click', logout);
    
    // Functions
    function checkAuth() {
        fetch('/api/auth/me', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.data || !data.data.user) {
                window.location.href = '/';
                return;
            }
            
            const user = data.data.user;
            if (user.role !== 'admin') {
                if (user.role === 'college') {
                    window.location.href = '/college-dashboard.html';
                } else {
                    window.location.href = '/';
                }
                return;
            }
            
            loadDashboard();
        })
        .catch(() => {
            window.location.href = '/';
        });
    }
    
    function loadDashboard() {
        showLoading();
        
        Promise.all([
            fetchOverview(),
            fetchCollegeComparison(),
            fetchEventTrend(),
            fetchDataQuality(),
            fetchDataTrust()
        ])
        .then(([overview, comparison, events, quality, trust]) => {
            dashboardData = {
                overview,
                comparison,
                events,
                quality,
                trust
            };
            
            renderDashboard(dashboardData);
            showContent();
            updateLastRefreshed();
        })
        .catch(error => {
            console.error('Error loading dashboard:', error);
            showError();
        });
    }
    
    function fetchOverview() {
        return fetch('/api/admin/overview', { credentials: 'include' })
            .then(response => response.json())
            .then(data => data.success ? data.data : null);
    }
    
    function fetchCollegeComparison() {
        return fetch('/api/admin/college-comparison', { credentials: 'include' })
            .then(response => response.json())
            .then(data => data.success ? data.data : null);
    }
    
    function fetchEventTrend() {
        return fetch('/api/admin/event-trend', { credentials: 'include' })
            .then(response => response.json())
            .then(data => data.success ? data.data : null);
    }
    
    function fetchDataQuality() {
        return fetch('/api/admin/data-quality', { credentials: 'include' })
            .then(response => response.json())
            .then(data => data.success ? data.data : null);
    }
    
    function fetchDataTrust() {
        return fetch('/api/admin/data-trust', { credentials: 'include' })
            .then(response => response.json())
            .then(data => data.success ? data.data : null);
    }
    
    function renderDashboard(data) {
        renderAdminKPIs(data.overview);
        renderComparisonTable(data.comparison);
        renderAdminCharts(data);
        renderAdminQuality(data.quality);
        renderAdminTrust(data.trust);
    }
    
    function renderAdminKPIs(overview) {
        if (!overview) return;
        
        const kpis = [
            { label: 'Total Colleges', value: overview.totalColleges },
            { label: 'Total Students', value: overview.totalStudents },
            { label: 'Overall Placement Rate', value: overview.overallPlacementRate + '%' },
            { label: 'Total Applications', value: overview.totalApplications },
            { label: 'Total Offers', value: overview.totalOffers },
            { label: 'Offer Acceptance Rate', value: overview.overallOfferAcceptance + '%' },
            { label: 'Active Recruiters', value: overview.totalActiveRecruiters },
            { label: 'Total Portal Events', value: overview.totalPortalEvents }
        ];
        
        const grid = document.getElementById('adminKpiGrid');
        grid.innerHTML = '';
        
        kpis.forEach(kpi => {
            const card = document.createElement('div');
            card.className = 'kpi-card';
            card.innerHTML = `
                <div class="kpi-label">${kpi.label}</div>
                <div class="kpi-value">${kpi.value}</div>
            `;
            grid.appendChild(card);
        });
    }
    
    function renderComparisonTable(comparison) {
        const container = document.getElementById('comparisonTableContainer');
        if (!comparison || comparison.length === 0) {
            container.innerHTML = '<p>No comparison data available.</p>';
            return;
        }
        
        // Find best and worst performers
        const best = comparison.length > 0 ? comparison[0] : null;
        const worst = comparison.length > 0 ? comparison[comparison.length - 1] : null;
        
        let tableHTML = `
            <div style="margin-bottom: 16px; display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="background: #c6f6d5; padding: 8px 16px; border-radius: 6px;">
                    <strong>🏆 Highest Performing:</strong> ${best ? best.collegeName : 'N/A'} (${best ? best.placementRate + '%' : ''})
                </div>
                <div style="background: #fed7d7; padding: 8px 16px; border-radius: 6px;">
                    <strong>⚠️ Lowest Performing:</strong> ${worst ? worst.collegeName : 'N/A'} (${worst ? worst.placementRate + '%' : ''})
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>College</th>
                            <th>Students</th>
                            <th>Placement Rate</th>
                            <th>Engagement</th>
                            <th>Skill Readiness</th>
                            <th>Applications</th>
                            <th>Offers</th>
                            <th>Offer Acceptance</th>
                            <th>Recruiters</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        comparison.forEach(college => {
            tableHTML += `
                <tr>
                    <td><strong>${college.collegeName}</strong></td>
                    <td>${college.totalStudents}</td>
                    <td>${college.placementRate}%</td>
                    <td>${college.engagementRate}%</td>
                    <td>${college.skillReadinessRate}%</td>
                    <td>${college.totalApplications}</td>
                    <td>${college.totalOffers}</td>
                    <td>${college.offerAcceptanceRate}%</td>
                    <td>${college.activeRecruiters}</td>
                    <td><span class="status-badge ${college.status}">${college.status}</span></td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    function renderAdminCharts(data) {
        // Destroy existing charts
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
        
        // Placement Comparison Chart
        if (data.comparison && data.comparison.length > 0) {
            const ctx = document.getElementById('placementComparisonChart').getContext('2d');
            charts.placementComp = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.comparison.map(c => c.collegeName),
                    datasets: [{
                        label: 'Placement Rate (%)',
                        data: data.comparison.map(c => c.placementRate),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
            
            // Engagement Comparison Chart
            const ctx2 = document.getElementById('engagementComparisonChart').getContext('2d');
            charts.engagementComp = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: data.comparison.map(c => c.collegeName),
                    datasets: [{
                        label: 'Engagement Rate (%)',
                        data: data.comparison.map(c => c.engagementRate),
                        backgroundColor: 'rgba(72, 187, 120, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
            
            // Skill Readiness Chart
            const ctx3 = document.getElementById('skillReadinessChart').getContext('2d');
            charts.skillReadiness = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: data.comparison.map(c => c.collegeName),
                    datasets: [{
                        label: 'Skill Readiness Rate (%)',
                        data: data.comparison.map(c => c.skillReadinessRate),
                        backgroundColor: 'rgba(237, 137, 54, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
        
        // Platform Event Trend Chart
        if (data.events && data.events.length > 0) {
            const ctx = document.getElementById('platformEventChart').getContext('2d');
            charts.eventTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.events.map(e => e.month),
                    datasets: [{
                        label: 'Portal Events',
                        data: data.events.map(e => e.events),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
    }
    
    function renderAdminQuality(quality) {
        const panel = document.getElementById('qualityPanel');
        if (!quality) {
            panel.innerHTML = '<p>No quality data available.</p>';
            return;
        }
        
        const allPassed = quality.failedChecks === 0;
        panel.innerHTML = `
            <div class="quality-panel">
                <div style="text-align: center; margin-bottom: 16px;">
                    <div class="quality-score" style="color: ${quality.qualityScore >= 80 ? '#38a169' : quality.qualityScore >= 60 ? '#d69e2e' : '#e53e3e'}">
                        ${quality.qualityScore}%
                    </div>
                    <div style="font-size: 14px; color: #718096;">
                        ${quality.passedChecks} of ${quality.totalChecks} checks passed
                    </div>
                    ${allPassed ? '<div style="color: #38a169; font-weight: 500; margin-top: 8px;">✓ All critical data quality checks passed.</div>' : ''}
                </div>
                <div class="quality-checks">
                    ${quality.checks.map(check => `
                        <div class="quality-check ${check.passed ? 'passed' : 'failed'}">
                            <span>${check.passed ? '✓' : '✗'} ${check.name}</span>
                            <span>${check.details}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    function renderAdminTrust(trust) {
        const panel = document.getElementById('trustPanel');
        if (!trust) {
            panel.innerHTML = '<p>No trust data available.</p>';
            return;
        }
        
        const statusClass = trust.freshnessStatus ? trust.freshnessStatus.toLowerCase() : 'no-data';
        panel.innerHTML = `
            <div class="trust-panel">
                <div class="trust-item">
                    <div class="trust-label">Last Event Received</div>
                    <div class="trust-value">${trust.latestEvent ? new Date(trust.latestEvent.timestamp).toLocaleString() : 'No events'}</div>
                    <div class="trust-sub">${trust.latestEvent ? trust.latestEvent.eventName : ''} ${trust.latestEvent ? '(' + trust.latestEvent.collegeName + ')' : ''}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">Data Age</div>
                    <div class="trust-value">${trust.dataAge}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">Total Events Processed</div>
                    <div class="trust-value">${trust.totalEventsProcessed}</div>
                </div>
                <div class="trust-item">
                    <div class="trust-label">Freshness Status</div>
                    <div class="trust-value trust-status ${statusClass}">${trust.freshnessStatus}</div>
                </div>
            </div>
        `;
    }
    
    function navigateTo(section) {
        // Update nav
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav a[data-section="${section}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        // Update sections
        sections.forEach(s => s.classList.remove('active'));
        const activeSection = document.getElementById(`section-${section}`);
        if (activeSection) activeSection.classList.add('active');
    }
    
    function showLoading() {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        emptyState.style.display = 'none';
    }
    
    function showError() {
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        emptyState.style.display = 'none';
    }
    
    function showContent() {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        emptyState.style.display = 'none';
    }
    
    function updateLastRefreshed() {
        const now = new Date();
        lastRefreshedEl.textContent = `Last refreshed: ${now.toLocaleString()}`;
    }
    
    function logout() {
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