from airflow import DAG
from datetime import timedelta, datetime
import json
import os
import requests
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator

# load the config data from the JSON file
with open("/home/ubuntu/airflow/config.json") as configFile:
    apiHostKey = json.load(configFile)

# format of date to be added in every file
dateTimeNowString = datetime.now().strftime("%d%m%Y%H%M%S")

#name of the bucket containing the CSV data
csvBucket = "zillow-rental-response-csv-transformed-bucket"

# these are some input arguments that wew will be using when creating the DAG
# these arguments are saying that the owner of the pipeline is airflow, it started
# on the start date, when something fails, it will email the failure to a specified
# email, it will retry and operation 2 times until declaring failure and the retries
# are 15 seconds apart
defaultArgs = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 4, 9),
    'email': ['avig1998@gmail.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(seconds=15)
}

#function to extract the data from the zillow API
def extractZillowData(**kwargs):
    
    #extract the key word arguments
    url = kwargs["url"]
    queryString = kwargs["querystring"]
    headers = kwargs["headers"] 
    dateString = kwargs["dateString"]

    #make a call to the Zillow API
    response = requests.get(url, headers= headers, params= queryString)

    responseData = response.json()

    #create the names of the output files and specify the path as well
    outputFilePath = f"/home/ubuntu/zillowResponseData/zillowRentalResponseData-{dateString}.json"

    responseFileName = f'zillowRentalResponseData-{dateString}.csv'

    # write the JSON response into the file
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(outputFilePath), exist_ok=True)

    outputFile = open(outputFilePath, "w")
    json.dump(responseData, outputFile, indent=4)

    outputFile.close()

    outputList = [outputFilePath, responseFileName]

    return outputList

# create the DAG
# it is setup such that it runs every 12 hours
with DAG('zillow_rental_analytics_dag', default_args=defaultArgs, schedule_interval= '0 */12 * * *', catchup=False) as dag:
    
    # This is the first node of the DAG. It is a python operator. This node will be used to extract the data from the
    # data source
    extractZillowDataNode = PythonOperator(
        task_id= 'extract-zillow-data-task',
        python_callable= extractZillowData,
        op_kwargs={'url': 'https://zillow56.p.rapidapi.com/search', 'querystring': {"location":"McLean, VA","status":"forRent"},
                   'headers': apiHostKey, 'dateString': dateTimeNowString}
    )

    # This is the second node of the DAG. It is a bash operator, which means that this task will execute a specified bash command
    # when it runs
    loadToS3Node = BashOperator(
        task_id= 'load-response-data-to-S3-task',
        bash_command= '/home/ubuntu/zillowProject_venv/bin/aws s3 mv {{ ti.xcom_pull("extract-zillow-data-task")[0]}} s3://zillow-rental-response-bucket/'
    )

    # This is the third node of the DAG. It is a S3KeySensor. 
    # This operator Waits for one or multiple keys (a file-like instance on S3) to be present in a S3 bucket.
    isFileInS3Node = S3KeySensor(
        task_id = 'check-if-transformed-csv-is-in-S3-task',
        bucket_key = '{{ti.xcom_pull("extract-zillow-data-task")[1]}}',
        bucket_name = csvBucket,
        aws_conn_id = 'aws_s3_conn',
        wildcard_match = False,
        timeout = 60, # Timeout for the sensor
        poke_interval = 5 # Time interval between S3 checks is 5 seconds
    )

    # This is the fourth node of the DAG. It is a S3ToRedshiftOperator
    # This operator Executes an COPY command to load files from s3 to Redshift.
    transferS3ToRedshiftNode = S3ToRedshiftOperator(
        task_id = 'transfer-csv-in-s3-to-redshift-task',
        aws_conn_id = 'aws_s3_conn',
        redshift_conn_id = 'conn_id_redshift',
        s3_bucket = csvBucket,
        s3_key = '{{ti.xcom_pull("extract-zillow-data-task")[1]}}',
        schema = "PUBLIC",
        table = "zillowdata",
        copy_options = ["csv IGNOREHEADER 1"],
    )
    
    extractZillowDataNode >> loadToS3Node >> isFileInS3Node >> transferS3ToRedshiftNode
