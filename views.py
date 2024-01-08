from flask import Flask, Blueprint, jsonify, request, render_template, redirect, url_for, send_from_directory, session
import vertexai
from vertexai.language_models import TextGenerationModel
from google.oauth2 import service_account
from google.auth.transport import requests
import google.oauth2.id_token
from google.cloud import bigquery
import glob
import secrets
from datetime import datetime

views = Blueprint(__name__, "views")
firebase_request_adapter = requests.Request()
@views.route('/ads.txt')
def ads():
    return send_from_directory(views.root_path, 'ads.txt')

def get_credentials():
    key_path = glob.glob("config/*.json")[0]
    credentials = service_account.Credentials.from_service_account_file(key_path)

    return credentials

def get_all_data_by_4(country):
    credentials = get_credentials()
    # Construct a BigQuery client object.
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)

    query = """
        SELECT
            SUBSTRING(CAST(run_date AS STRING), 0, 16) AS run_date,
            country,
            country_rank,
            rank,
            keyword,
            hrs,
            title,
            thumbnail,
            videolink
        FROM (
            SELECT
                DISTINCT TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) AS run_date,
                RANK() OVER(PARTITION BY country ORDER BY TIMESTAMP_ADD(_PARTITIONTIME, INTERVAL 9 HOUR) DESC) AS country_rank,
                country,
                rank,
                keyword,
                hrs,
                title,
                thumbnail,
                videolink
            FROM
                `ytranks-52d09.ytRanksDaily.ytRanksDailyALL`
            WHERE country = '{}'
            ORDER BY
                run_date DESC,
                hrs,
                country ) AS A
        WHERE
            country_rank < 5
        ORDER BY A.run_date DESC, country, country_rank, rank
    """

    query_job = client.query(query.format(country))
    result = {}
    for row in query_job:
        # if country already exists
        if str(row[1]) in result:
            # Check country_rank already exists
            if str(row[2]) in result[str(row[1])]:
                # if country_rank exists, check rank is exists
                if str(row[3]) in result[str(row[1])][str(row[2])]:
                    result[str(row[1])][str(row[2])][str(row[3])]['fields'].append({
                        'title': str(row[6]),
                        'thumbnail': str(row[7]),
                        'videolink': str(row[8])
                    })
                else:
                    result[str(row[1])][str(row[2])][str(row[3])] = {
                        'keyword': str(row[4]),
                        'fields': [
                            {
                                'title': str(row[6]),
                                'thumbnail': str(row[7]),
                                'videolink': str(row[8])
                            }
                        ]
                    }
            else:
                result[str(row[1])][str(row[2])] = {
                    'run_date': str(row[0]),
                    str(row[3]) : {
                        'keyword': str(row[4]),
                        'fields': [
                            {
                                'title': str(row[6]),
                                'thumbnail': str(row[7]),
                                'videolink': str(row[8])
                            }
                        ]
                    }
                }
        else:
            result[str(row[1])] = {
                str(row[2]): {
                    'run_date': str(row[0]),
                    str(row[3]) : {
                        'keyword': str(row[4]),
                        'fields': [
                            {
                                'title': str(row[6]),
                                'thumbnail': str(row[7]),
                                'videolink': str(row[8])
                            }
                        ]
                    }
                }
            }
    return result

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

def generate_random_id():
    random_id = secrets.token_hex(4)
    return random_id

def format_resp(resp):
    lines = resp.split('\n')

    definition = lines[0].split(': ')[1]
    examples = lines[2:]

    examples = list(filter(None, examples))

    formatted_resp = {
        'definition':definition,
        'examples': examples
    }

    return formatted_resp

@views.route("/")
def home():
    top_ranks_by_ctry = get_top_five_rank_data()
    top_one_rank_by_ctry = get_top_one_rank_data()
    # print(top_ranks_by_ctry['japan'])
    return render_template("index.html", top_ranks = top_ranks_by_ctry, one_rank = top_one_rank_by_ctry)

@views.route("/yt_kr")
def yt_kr():
    all_data_by_4 = get_all_data_by_4()
    # print(all_data_by_4['japan'])
    return render_template("yt_kr.html", all_data_by_4 = all_data_by_4)

@views.route("/yt/<country>")
def yt_video(country):
    print(country)
    return_template = ""
    top_ranks_by_ctry = get_top_five_rank_data()
    all_data_by_4 = get_all_data_by_4(country)
    if country == "south_korea":
        return_template = "yt_kr.html"
    elif country == "japan":
        return_template = "yt_jp.html"
    elif country == "united_states":
        return_template = "yt_us.html"

    return render_template(return_template, all_data_by_4 = all_data_by_4, top_ranks = top_ranks_by_ctry)

@views.route("/yt/json/<country>", methods = ['GET'])
def yt_json_video(country):
    print(country)
    # return_template = ""
    # top_ranks_by_ctry = get_top_five_rank_data()
    all_data_by_4 = get_all_data_by_4(country)
    # if country == "south_korea":
    #     return_template = "yt_kr.html"
    # elif country == "japan":
    #     return_template = "yt_jp.html"
    # elif country == "united_states":
    #     return_template = "yt_us.html"

    return jsonify(all_data_by_4[country]["1"])

@views.route("/eng/upload")
def eng_upload_init():
    id_token = request.cookies.get("token")
    if id_token:
        return render_template("eng_upload.html")
    else:
        return render_template("login.html")

@views.route("/eng/list")
def eng_list():
    id_token = request.cookies.get("token")
    if id_token:
        print('user signed in')
        credentials = get_credentials()
        try:
            claims = google.oauth2.id_token.verify_firebase_token(
                    id_token, firebase_request_adapter
                )
            user_id = claims["user_id"]
            print(user_id)
        except ValueError as exc:
            # This will be raised if the token is expired or any other
            # verification checks fail.
            error_message = str(exc)
        # Construct a BigQuery client object.
        client = bigquery.Client(credentials=credentials, project=credentials.project_id)
        query = """
            SELECT
                id,
                script,
                title,
                insert_date
            FROM
                `ytranks-52d09.ytRanksDaily.engScripts`
            WHERE 
                user_id = '{}'
            ORDER BY insert_date, title
        """

        query_job = client.query(query.format(user_id))
        result = []
        for row in query_job:
            # Row values can be accessed by field name or index.
            row_result = {
                'id': str(row[0]),
                'script': str(row[1]),
                'title': str(row[2]),
                'insert_date': str(row[3])
            }
            result.append(row_result)

        return render_template("eng_list.html", query_list = result)
    else:
        print('user signed out')
        return render_template("login.html")
    

@views.route("/eng/detail/<script_id>")
def script_detail(script_id):
    credentials = get_credentials()
    # Construct a BigQuery client object.
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)
    query = """
        SELECT
            id,
            script,
            title,
            insert_date
        FROM
            `ytranks-52d09.ytRanksDaily.engScripts`
        WHERE id = '{}'
    """

    query_job = client.query(query.format(script_id))
    for row in query_job:
        result = {
            'id': str(row[0]),
            'script': str(row[1]),
            'title': str(row[2]),
            'insert_date': str(row[3])
        }
    
    return render_template("eng_detail.html", result = result)

@views.route("/eng/upload_script", methods=['POST'])
def upload_script():
    title = request.form.get('title')
    script_content = request.form.get('script')
    script_id = generate_random_id()
    insert_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    id_token = request.cookies.get("token")
    if id_token:
        print('user signed in')
        try:
            claims = google.oauth2.id_token.verify_firebase_token(
                    id_token, firebase_request_adapter
                )
            user_id = claims["user_id"]
            print(user_id)
        except ValueError as exc:
            # This will be raised if the token is expired or any other
            # verification checks fail.
            error_message = str(exc)
    credentials = get_credentials()
    # Construct a BigQuery client object.
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)

    query = """
        INSERT INTO `ytranks-52d09.ytRanksDaily.engScripts`
        VALUES (@script_id, @script_content, @title, @insert_date, @user_id)
    """
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("script_id", "STRING", script_id),
            bigquery.ScalarQueryParameter("script_content", "STRING", script_content),
            bigquery.ScalarQueryParameter("title", "STRING", title),
            bigquery.ScalarQueryParameter("insert_date", "STRING", insert_date),
            bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
        ]
    )

    query_job = client.query(query, job_config=job_config) 

    errors = query_job.errors
    if errors:
        for error in errors:
            query_result = {"result": error['message']}
        return query_result
    else:
        query_result = {"result": "success"}
        return query_result
    
@views.route("/eng/search/<input>/<id>", methods = ['GET'])
def search_word(input, id):
    vertexai.init(
        project='ytranks-52d09', 
        location='us-central1',
        credentials=get_credentials()
    )
    prompt = f"Define the word '{input}'. Provide three example sentences. The response format is 'Definition: definition of the word\n Example sentences:\n 1. Example1\n2. Example2\n3. Example3'"
    parameters = {
        "temperature": 0.3,  # Temperature controls the degree of randomness in token selection.
        "max_output_tokens": 256,  # Token limit determines the maximum amount of text output.
        "top_p": 0.8,  # Tokens are selected from most probable to least until the sum of their probabilities equals the top_p value.
        "top_k": 40,  # A top_k of 1 means the selected token is the most probable among all tokens.
    }

    model = TextGenerationModel.from_pretrained("text-bison@001")
    response = model.predict(
        prompt,
        **parameters,
    )
    return jsonify(format_resp(response.text))