import json
import boto3
import pandas as pd
from datetime import datetime

s3Client = boto3.client('s3')

def lambda_handler(event, context):
    
    sourceBucket = event['Records'][0]['s3']['bucket']['name']
    objectKey = event['Records'][0]['s3']['object']['key']
    
    print(f"The objectKey is: {objectKey}")
    print(f"The source bucket is: {sourceBucket}")
    
    targetBucket = 'zillow-rental-response-csv-transformed-bucket'
    targetFileName = objectKey[:-5]
    
    print(f"Target File Name: {targetFileName}")
    
    waiter = s3Client.get_waiter('object_exists')
    waiter.wait(Bucket=sourceBucket, Key=objectKey)
    
    response = s3Client.get_object(Bucket=sourceBucket, Key=objectKey)
    print(f"Response: {response}")
    
    data = response['Body'].read().decode('utf-8')
    print(f"Data: {data}")
    
    data = json.loads(data)
    print(f"JSON Data: {data}")
    
    f = []
    
    for i in data["results"]:
        f.append(i)
        
    df = pd.DataFrame(f)
    
    #Select the specific columns
    selectedCols = ["bathrooms", "bedrooms", "homeType", "livingArea", "price", "streetAddress", "zipcode"]
    
    df = df[selectedCols]
    
    df['date'] = datetime.now()
    
    df['city'] = 'McLean'
    
    print(f"DataFrame: {df}")
    
    #convert the data to CSV
    csvData = df.to_csv(index=False)
    
    # Upload this CSV to S3
    bucketName = targetBucket
    objectKey = f"{targetFileName}.csv"
    
    s3Client.put_object(Bucket=bucketName, Key=objectKey, Body=csvData)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Conversion of JSON to CSV and uploaded to S3 Complete!')
    }
