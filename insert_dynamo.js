const AWS = require('aws-sdk')
AWS.config.update({
  region: 'us-east-1'
})

const dynamo = new AWS.DynamoDB()

const bottom = 80
const top = 90

const promises = []
for (let i = bottom; i < top; i++) {
  const p = dynamo.putItem({
    Item: {
      id: {
        N: String(i)
      },
      nome: {
        S: `andre${i}`
      }
    },
    TableName: 'PaxLabDynamoHive'
  }).promise()

  promises.push(p)
}

Promise.all(promises).then(() => console.log('inseridos')).catch(console.error)
