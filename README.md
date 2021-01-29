Node based control system for dcserver - cli, eventually gui


## Tables

### General

Needed for each AWS account

one aws account key per agency

**dcAgency**
* dcAlias - S                   alias -> dca
  dcTitle - S
      --- entered for each account added, not copied from prime ---
  dcNote - S
  dcDefaultVPC - S
  dcDefaultAZ - S
  dcDefaultSG - S

**dcSecurityGroup**
* dcSecurityGroup - S           aws sg id
  dcPublicPorts                 [ port, port, etc  ]    
  dcManagingAgency - S          alias - dca
  dcAllowedAgencies             [ alias, alias, etc ]

**dcSubnet**                                            during install, pick the VPC and the AZ, then a matching subnet is automatically found
* dcSubnet - S                  aws subnet id
  dcAvailabilityZone - S        aws az
  dcManagingAgency - S          alias - dca

**dcDeployment**
* dcAlias - S                   alias -> prod-2
  dcTitle - S                   copied from prime
  dcNote - S                    "
  dcRootHost - S                " - url for root tenant, ex. prod-3.designcraftadvertising.com
  dcManagingAgency - S          alias - dca

**dcDeploymentNode**
* dcId - S                      dep alias + "_" + node
  dcAlias - S                   alias -> prod-2
  dcNodeId - S
      --- orienting info ---
  dcSecurityGroup - S           aws sg id
  dcSubnet - S                  aws subnet id
  dcAvailabilityZone - S        aws az
      --- instance info ---
  dcUser - S                    ec2 user to login as
  dcKeyPair - S                 ec2 key pair id
  dcInstanceId - S              ec2 instance id
  dcServerType                  ec2 server type ex. "m5n.large"
  dcIpAddressAllocationId       ec2 ip allocation id (not association id)
  dcReserveId                   ec2 reservation association
  dcBootDiskVolumeId            ec2 volume id
  dcBootDiskDevice              device name such as nvme0n1 (from /dev/nvme0n1)
  dcServerDiskVolumeId          ec2 volume id
  dcServerDiskDevice            device name such as nvme1n1 (from /dev/nvme1n1)

#### Compiled tables

combine info from multiple agencies prime accounts

**dcAgencySecurityCompiled**
* dcCompileId - S               aws id + "_" + agency alias
  dcSecurityGroup - S           aws id
  dcAgency - S                  alias - dca
  dcAccessRules                 [
    {
      Name: nnnn,             // user or location such as an office
      Access: 'CDIR'
    }
  ]

compile process
- connect to prime account
- collect rules in dcConfigPrime (of your prime account)
- collect rules for members of team
  - for each secondary account find the Deployments
  - for each Deployment find the Teams
  - for each Team find the members
- combine all these rules
- set dcAgencySecurityCompiled in prime account by taking these combined rules and
  - find the dcSecurityGroup for each prime Deployment
  - set into compiled record
  - run the sg updator for that security group
    - combine the dcPublicPorts from there
    - get rules from dcAgencySecurityCompiled for ALL agencies in that account
- for each secondary account
  - find the dcSecurityGroup for each secondary account
  - set into compiled record
  - run the sg updator for that security group
    - combine the dcPublicPorts from there
    - get rules from dcAgencySecurityCompiled for ALL agencies in that account

### Primary Account

the account where the dcConfig's dcManagingAgency is the same agency as the one who owns the account. Such as DCA's AWS account - the dca agency then would be the Primary and use these tables.

**dcConfigPrime**
* dcAlias - S                   always "root" - always 1 item
  dcManagingAgency - S          alias for this account - dca
  dcAccessRules                 [                 // these get copied to all other Accounts in the form of compiled
    {
      Name: nnnn,             // user or location such as an office
      Access: 'CDIR'
    }
  ]

**dcUsersPrime**
* dcId - S                      uuid
  dcName - S
  dcNote - S
  dcAccessRules                 [
    {
      Name: nnnn,             // user or location such as an office
      Access: 'CDIR'
    }
  ]

**dcTeamPrime**
* dcId - S                      uuid
  dcTitle - S
  dcNote - S

**dcTeamMemberPrime**
* dcId - S                      uuid
  dcUser - S                    uuid
  dcTeam - S                    uuid

**dcAccountPrime**              // for accounts other than prime
* dcId - S                      
  dcTitle - S
  dcNote - S                    // this note goes into the dcAgency note in the destination account
  dcPlatform:                   ex. "AWS"
  dcControlRegion:              ex. "us-east-1"
  KeyId:                        to access the platform
  SecretKey                     encrypted, from the local config file

**dcDeploymentPrime**
* dcAlias - S                   alias -> prod-2
  dcTitle - S
  dcNote - S
  dcRootHost - S                url for root tenant, ex. prod-3.designcraftadvertising.com
  ComputeRegion:                ex. "us-east-2",
  StorageRegion:                ex. "us-east-1"

**dcAccountDeploymentPrime**
* dcId - S                      uuid
  dcAccount - S                 uuid
  dcDeployment -                uuid

**dcDeploymentTeamPrime**
* dcId - S                      uuid
  dcDeployment -                uuid
  dcTeam - S                    uuid
