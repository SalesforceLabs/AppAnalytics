#!/bin/bash

sfdx force:org:create -f config/project-scratch-def.json -a AppAnalytics  --setdefaultusername -d 1

#Install LMA Package
sfdx force:package:install -p 04t30000001DWL0 -w 20

#Push Source
sfdx force:source:push -f

#Grant Permission
sfdx force:user:permset:assign -n AppAnalytics

#Open Org
sfdx force:org:open -p lightning/n/App_Analytics_Query_Requests
