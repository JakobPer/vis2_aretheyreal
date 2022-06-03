import csv, sys

chunkCount = 137
dataPrefix = 'data/data_'
outPrefix = 'data/coords_'

filename = 'data/data_000'
outname = 'data/coords_000'

index = 0

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

# 4 shape
# 10/11 lat/long

