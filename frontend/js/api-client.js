// Backend API communication
const API_BASE_URL = 'http://localhost:8000';

/**
 * API client for communicating with the backend
 */
class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Make an API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Graph endpoints
    async getGraph(graphId) {
        return this.request(`/api/graphs/${graphId}`);
    }

    async createGraph(graphData) {
        return this.request('/api/graphs', {
            method: 'POST',
            body: JSON.stringify(graphData)
        });
    }

    async updateGraph(graphId, graphData) {
        return this.request(`/api/graphs/${graphId}`, {
            method: 'PUT',
            body: JSON.stringify(graphData)
        });
    }

    async deleteGraph(graphId) {
        return this.request(`/api/graphs/${graphId}`, {
            method: 'DELETE'
        });
    }

    // Node endpoints
    async addNode(graphId, nodeData) {
        return this.request(`/api/graphs/${graphId}/nodes`, {
            method: 'POST',
            body: JSON.stringify(nodeData)
        });
    }

    async updateNode(nodeId, nodeData) {
        return this.request(`/api/graphs/nodes/${nodeId}`, {
            method: 'PUT',
            body: JSON.stringify(nodeData)
        });
    }

    async deleteNode(nodeId) {
        return this.request(`/api/graphs/nodes/${nodeId}`, {
            method: 'DELETE'
        });
    }

    // Edge endpoints
    async addEdge(graphId, edgeData) {
        return this.request(`/api/graphs/${graphId}/edges`, {
            method: 'POST',
            body: JSON.stringify(edgeData)
        });
    }

    async deleteEdge(edgeId) {
        return this.request(`/api/graphs/edges/${edgeId}`, {
            method: 'DELETE'
        });
    }

    // Project endpoints
    async getProjects(search = null) {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.request(`/api/projects${query}`);
    }

    async getProject(projectId) {
        return this.request(`/api/projects/${projectId}`);
    }

    async createProject(projectData) {
        return this.request('/api/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(projectId, projectData) {
        return this.request(`/api/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(projectId) {
        return this.request(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    async getProjectMetadata(projectId) {
        return this.request(`/api/projects/${projectId}/metadata`);
    }
}

// Export singleton instance
export const apiClient = new APIClient();


