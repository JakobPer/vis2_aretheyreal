import csv, sys
import json, os

if not os.path.isdir('data/json'):
    os.mkdir('data/json')

chunkCount = 137
dataPrefix = 'data/data_'
outPrefix = 'data/coords_'

filename = 'data/data_000'
outname = 'data/coords_000'

index = 0
# extract columns
for i in range(0, chunkCount):
    num = str(i).zfill(3)
    filename = dataPrefix + num
    outname = outPrefix + num
    print(filename + " > " + outname)

    with open(filename,newline='', encoding='utf-8') as f:
        with open(outname,'w',newline='', encoding='utf-8') as out:
            reader = csv.reader(f)
            writer = csv.writer(out, delimiter=',')
            try:
                for row in reader:
                    writer.writerow([index, row[4], row[10], row[11]])
                    index = index + 1
            except csv.Error as e:
                    sys.exit('file {}, line {}: {}'.format(filename, reader.line_num, e))

index = 0
# to json
headings = ["summary","city","state","date_time","shape","duration","stats","report_link","text","posted","city_latitude","city_longitude"]
for i in range(0, chunkCount):
    num = str(i).zfill(3)
    filename = dataPrefix + num
    print(filename)

    with open(filename,newline='', encoding='utf-8') as f:
        reader = csv.reader(f)

        try:
            for row in reader:
                dict = {}
                for hi in range(len(headings)):
                    if headings[hi] == "report_link":
                        link = row[hi]
                        if "webreports" in link:
                            link = link.replace("webreports", "webreports/reports")
                        dict[headings[hi]] = link
                    else:
                        dict[headings[hi]] = row[hi]
                outname = 'data/json/json_' + str(index).zfill(6)
                with open(outname,'w',newline='', encoding='utf-8') as out:
                    json.dump(dict,out)
                    #writer.writerow([index, row[4], row[10], row[11]])
                index = index + 1
        except csv.Error as e:
                sys.exit('file {}, line {}: {}'.format(filename, reader.line_num, e))

# 4 shape
# 10/11 lat/long

