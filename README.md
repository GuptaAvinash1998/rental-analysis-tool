# rentalAnalysisTool
This is a tool that helps a user understand the market of a location of their desire. The UI is very simple, it contains a search bar where the user can enter the name of the city that they are interested in, or the zipcode as well. The results will be displayed in a dashboard and will also contain dropdowns that can be used to filter out results.

The UI looks like this

Image location: https://github.gatech.edu/agupta907/rental-analysis-tool/issues/1#issuecomment-149667


The tool communicates with a simple web server that runs in the localhost.

The results are powered by the data that is being collected in AWS. In the AWS cloud, an EC2 instance hosts a running ETL pipeline in an apache airflow server. The pipeline contains 4 stages like so

Image location: https://github.gatech.edu/agupta907/rental-analysis-tool/issues/1#issuecomment-149668


The first step extracts data from a zillow API using Rapi API. The data contains a list of all the rental properties located in McLean, VA.
The second step takes the results and stores both them in an S3 bucket

When the JSON data is inserted into the bucket, this triggers a lambda function that will be used to convert the data from JSON into CSV and stores it in another S3 bucket. While this is happening, the third stage of the pipeline will continously poke at the S3 bucket to check if the CSV is present.

Once the data is in the bucket, it will trigger the fourth step of the pipeline which is to insert the CSV data into a Redshift database for persistance.

The back end server will pull data from this database, caches it and presents the filtered data to the UI.
