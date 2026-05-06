// Jenkinsfile for DopeHKAI Test
//
// Git in /var/www/dopehkai must be writable by the Jenkins agent user (same user that runs this job).
// If you see: "insufficient permission for adding an object to repository database .git/objects"
// fix once on the deploy host, e.g. (replace jenkins if your agent user differs):
//   sudo chown -R jenkins:jenkins /var/www/dopehkai
// Or use a shared group: sudo chgrp -R jenkins /var/www/dopehkai && sudo chmod -R g+rwX /var/www/dopehkai
//
pipeline {
    agent any

    stages {
        stage('Deploy') {
            steps {
                dir('/var/www/dopehkai') {
                    sh '''
                        set -e
                        if [ ! -d .git ]; then
                            echo "ERROR: /var/www/dopehkai is not a git clone (missing .git)."
                            exit 1
                        fi
                        if [ ! -w .git/objects ]; then
                            echo "ERROR: Jenkins cannot write to /var/www/dopehkai/.git/objects"
                            echo "On the deploy server run (as root), using the same user as this agent ($(whoami)):"
                            echo "  sudo chown -R $(whoami):$(whoami) /var/www/dopehkai"
                            exit 128
                        fi
                        git fetch origin
                        git reset --hard origin/main
                    '''
                }

                dir('/var/www/dopehkai/frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }

                dir('/var/www/dopehkai/backend') {
                    sh 'npm install'
                    sh 'npm run build'
                }

                sh 'sudo /usr/bin/pm2 restart dope-backend'
            }
        }
    }
}