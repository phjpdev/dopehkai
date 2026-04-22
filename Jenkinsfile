// Jenkinsfile for DopeHKAI
pipeline {
    agent any

    stages {
        stage('Deploy') {
            steps {
                dir('/var/www/dopehkai') {
                    sh 'git fetch origin'
                    sh 'git reset --hard origin/main'
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