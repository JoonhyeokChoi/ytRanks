from flask import Flask, Blueprint, jsonify, request, render_template
import vertexai
from vertexai.language_models import TextGenerationModel
from google.oauth2 import service_account
from google.cloud import bigquery
import glob

views = Blueprint(__name__, "views")

def get_credentials():
    key_path = glob.glob("config/*.json")[0]
    credentials = service_account.Credentials.from_service_account_file(key_path)

    return credentials

def get_top_five_rank_data():
    credentials = get_credentials()
    # Construct a BigQuery client object.
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)

    query = """
        SELECT
            SUBSTRING(CAST(run_date AS STRING), 0, 16) AS run_date,
            country,
            rank,
            keyword
        FROM (
            SELECT DISTINCT 
                TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) AS run_date,
                RANK() OVER(PARTITION BY country ORDER BY TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) DESC) AS country_rank,
                country,
                rank,
                keyword,
                hrs
            FROM
                `ytranks-52d09.ytRanksDaily.ytRanksDailyALL`
            ORDER BY country, run_date desc, rank, hrs
        ) A
        WHERE country_rank = 1
    """

    query_job = client.query(query)
    result = {}
    for row in query_job:
        # Row values can be accessed by field name or index.
        if str(row[1]) in result:
            result[str(row[1])][str(row[2])] = str(row[3])
        else:
            result[str(row[1])] = {
                'run_date': str(row[0]),
                str(row[2]) : str(row[3])
            }
    return result

def get_top_one_rank_data():
    credentials = get_credentials()
    # Construct a BigQuery client object.
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)

    query = """
        SELECT
            FORMAT_TIMESTAMP('%F', A.run_date) AS run_date,
            country,
            rank,
            keyword,
            hrs,
            ARRAY_AGG(title) AS titles
        FROM (
            SELECT
                DISTINCT TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) AS run_date,
                RANK() OVER(PARTITION BY country ORDER BY TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) DESC) AS country_rank,
                country,
                rank,
                keyword,
                hrs,
                title
            FROM
                `ytranks-52d09.ytRanksDaily.ytRanksDailyALL`
            WHERE
                rank = 1
            ORDER BY
                run_date DESC,
                hrs,
                country ) AS A
        WHERE
            country_rank = 1
        GROUP BY 1, 2, 3, 4, 5
    """

    query_job = client.query(query)
    result = {}
    for row in query_job:
        # Row values can be accessed by field name or index.
        result[str(row[1])] = {
            'run_date': str(row[0]),
            'rank': str(row[2]),
            'keyword': str(row[3]),
            'hrs': str(row[4]),
            'titles': row[5]
        }
    return result

@views.route("/")
def home():
    top_ranks_by_ctry = get_top_five_rank_data()
    top_one_rank_by_ctry = get_top_one_rank_data()
    # print(top_ranks_by_ctry['japan'])
    return render_template("index.html", top_ranks = top_ranks_by_ctry, one_rank = top_one_rank_by_ctry)