const axios = require('axios');

export class AnsibleAutomationService {
    constructor() {}

    /**
     * Deploy deployment
     * @param id Deployment ID
     * @returns Deployment object
     */
    async deploy(id: string, authHeader: string): Promise<boolean> {
        const bundleUrl = `${process.env.APP_URL}/${id}/bundle.zip`
        const ansibleDeployUrl = `${process.env.ANSIBLE_API_URL}/job_templates/${process.env.ANSIBLE_DEPLOY_JOB_TEMPLATE_ID}/launch/`

        try {
            /* eslint-disable @typescript-eslint/naming-convention */
            const extra_vars = { 
                'zip_url': bundleUrl, 
                'deployment_id': id, 
                'supercloud_backend_token': authHeader 
            }
            const data = { 'extra_vars': JSON.stringify(extra_vars) }

            axios({
                method: 'post',
                url: ansibleDeployUrl,
                auth: {
                    username: process.env.ANSIBLE_PLATFORM_USERNAME,
                    password: process.env.ANSIBLE_PLATFORM_PASSWORD
                },
                headers: {
                    'Accept': 'application/json',
                },
                data: data
            })
                .then(() => {})
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .catch(function (error: any) {
                    throw Object.assign(new Error(error?.message), { code: 400 })
                })
            return true
        } catch (error) {
            throw Object.assign(new Error(error), { code: 500 })
        }
    }
}