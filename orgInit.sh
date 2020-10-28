#!/bin/bash
sfdx force:org:create -f config/project-scratch-def.json  --setdefaultusername -d 1 --apiversion=50.0

#Install LMA Package
sfdx force:package:install -p 04t30000001DWL0 -w 20

#Install App Analytics Package v 1.6
sfdx force:package:install -p 04t3i000002KSAZ -w 20

#Insert Sample Data
sfdx force:data:tree:import -p demoAssets/data/plan.json

#Push Source
#sfdx force:source:push -f

#Grant Permission
sfdx force:user:permset:assign -n AppAnalytics

#Open Org
sfdx force:org:open -p lightning/n/AppAnalytics__App_Analytics_Query_Requests
