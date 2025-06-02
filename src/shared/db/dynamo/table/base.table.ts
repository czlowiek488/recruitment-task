import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb'
import {
  BillingMode,
  KeyType,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb'

export const baseDynamoTable: CreateTableCommandInput = {
  TableName: 'baseTable',
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
  ],
  KeySchema: [{ AttributeName: 'id', KeyType: KeyType.HASH }],
  BillingMode: BillingMode.PAY_PER_REQUEST,
}
