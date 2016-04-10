class Hash
  def map(&block)
    if block_given?
      self.inject({}) { |h, (k,v)| h[k] = yield(k, v); h }
    else
      raise "block is needed for map."
    end
  end
end

class File
  def self.write(filename, content, mode='')
    open(filename, "w#{mode}") { |f| f.write(content) }
  end
end

desc "Download GTFS data"
task :download_data do
  require 'tempfile'
  require 'fileutils'

  url = 'http://www.caltrain.com/Assets/GTFS/caltrain/GTFS-Caltrain-Devs.zip'
  Tempfile.open('index.html') do |f|
    temp_file = f.path
    system("curl #{url} -o #{temp_file} && unzip -o #{temp_file} -d ./gtfs/ && rm #{temp_file}")
    f.unlink
  end

  [:prepare_data, :update_appcache].each do |task|
    Rake::Task[task].invoke
  end
end

desc "Prepare Data"
task :prepare_data do
  require "csv"
  require "json"
  require "plist"

  # Extend CSV
  class CSV
    class Table
      def keep_if(&block)
        delete_if { |item| !yield(item) }
      end
    end
    class Row
      # supports row.attr access method
      def method_missing(meth, *args, &blk)
        if meth =~ /\A(.*)\=\Z/
          self[$1.to_sym] = block_given? ? yield(args[0]) : args[0]
        else
          fetch(meth, *args, &blk)
        end
      end
    end
  end

  def read_CSV(name)
    CSV.read("gtfs/#{name}.txt", headers: true, header_converters: :symbol, converters: :all)
      .each { |item|
        item.service_id = item.service_id.to_s unless item[:service_id].nil?
        item.route_id = item.route_id.to_s unless item[:route_id].nil?
        item.trip_id = item.trip_id.to_s unless item[:trip_id].nil?
      }
  end

  # Read from CSV, prepare it with `block`, write what returns to JSON and PLIST files
  # If multiply names, expected to return a hash as NAME => CONTENT
  def prepare_for(*names, &block)
    raise "block is needed for prepare_for!" unless block_given?
    raise "filename is needed!" if names.size < 1

    csvs = names.map { |name| read_CSV(name) }
    hashes = yield(*csvs)
    hashes = { names[0] => hashes } if names.size == 1 # if only one name, make result as a hash
    hashes.each { |name, hash|
      File.write("data/#{name}.json", hash.to_json)
      File.write("data/#{name}.plist", Plist::Emit.dump(hash))
    }
  end


  # From:
  #   routes:
  #     route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color
  #     SHUTTLE,CT,,SHUTTLE,3,,
  #     LOCAL,CT,LOCAL,,2,,
  #     LIMITED,CT,,LIMITED,2,,
  #     BABY BULLET,CT,,BABY BULLET,2,,
  #   trips:
  #     route_id,service_id,trip_id,trip_headsign,direction_id,block_id,shape_id,trip_short_name
  #     SHUTTLE,4951,RTD6320540,DIRIDON STATION,0,,,
  #
  # Find only valid services by route type defined in routes
  valid_service_ids = []
  prepare_for("routes", "trips") do |routes, trips|
    valid_route_ids = routes
      .each { |route|
        # route_id should be non-empty, and be the same with short_name or long_name. If not, check data.
        if route.route_id.empty? or ![route.route_short_name, route.route_long_name].include? route.route_id
          require 'pry'; binding.pry
        end
        unless [2, 3].include? route.route_type
          require 'pry'; binding.pry
        end
      }
      .select { |route| route.route_type == 2 } # 2 for Rail, 3 for bus
      .map(&:route_id)

    valid_service_ids = trips
      .select { |trip| valid_route_ids.include? trip.route_id }
      .map(&:service_id)

    {}
  end

  # From:
  #   calendar:
  #     service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
  #     4929,1,1,1,1,1,0,0,20160404,20190406
  #     4930,0,0,0,0,0,1,0,20160404,20190406
  #     4951,0,0,0,0,0,1,1,20160404,20190406
  #   calendar_dates:
  #     service_id,date,exception_type
  #     4929,20160530,2
  #     4951,20160530,1
  # To:
  #   calendar:
  #     service_id => [fields]
  #     4930 => [0,0,0,0,0,1,0,20160404,20190406]
  #   calendar_dates:
  #     service_id => [[date, exception_type]]
  #     4929 => [[20160530,2]]
  prepare_for("calendar", "calendar_dates") do |calendar, calendar_dates|
    now_date = Time.now.strftime("%Y%m%d").to_i

    calendar = calendar
      .select { |service| valid_service_ids.include? service.service_id }
      .select { |service|
        warn "Drop outdated service #{service.service_id} ends at #{service.end_date}." if service.end_date < now_date
        service.end_date >= now_date
      }
      .each { |service|
        # Weekday should be available all together or none of them. If not, check data.
        weekday_sum = [:monday, :tuesday, :wednesday, :thursday, :friday].inject(0) { |sum, day| sum + service[day]}
        unless [0, 5].include? weekday_sum
          require 'pry'; binding.pry
        end
      }
      .group_by(&:service_id)
      .map { |service_id, items|
        if items.size != 1
          require 'pry'; binding.pry
        end
        item = items[0]
        # TODO: change this array to object {date: [start_date, end_date], weekday: true, saturday: false, sunday: false}
        [:monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday, :start_date, :end_date].map { |day| item[day] }
      }

    # update valid_service_ids to remove out-dated services
    valid_service_ids = calendar.keys

    dates = calendar_dates
      .select { |service|
        warn "Drop outdated service_date #{service.service_id} at #{service.date}." unless valid_service_ids.include? service.service_id
        valid_service_ids.include? service.service_id
      }
      .select { |service|
        warn "Drop outdated service_date #{service.service_id} at #{service.date}." if service.date < now_date
        service.date >= now_date
      }
      .group_by(&:service_id)
      .map { |service_id, items|
        items.map { |item| item.fields[1..-1] }
      }

    { calendar: calendar, calendar_dates: dates }
  end

  # Remove header and unify station_id by name
  # From:
  #   stop_id,stop_name,stop_lat,stop_lon,zone_id
  #   70021,CALTRAIN - 22ND ST STATION,37.757692,-122.392318,3329
  #   70022,CALTRAIN - 22ND ST STATION,37.757692,-122.392318,3329
  # To:
  #   stop_name => [stop_id1, stop_id2]
  #   "22ND ST" => [70021, 70022]
  prepare_for("stops") do |stops|
    stops
      .each { |item|
        # check data (if its scheme is changed)
        if item.stop_name !~ /^(CALTRAIN|SHUTTLE BUS)\ \-\ /
          require 'pry'; binding.pry
        end
      }
      .select { |item|
        # we only care about caltrain not shuttle bus
        /^CALTRAIN - /.match item.stop_name
      }
      .sort_by(&:stop_lat).reverse # sort stations from north to south
      .each { |item|
        # shorten the name
        item.stop_name.gsub!(/(CALTRAIN - | STATION)/, '')
        # rename Diridon to San Jose Diridon
        item.stop_name.gsub!('DIRIDON', 'SAN JOSE DIRIDON')
      }
      .group_by(&:stop_name)
      .map { |name, items| # customized Hash#map
        items.map(&:stop_id).sort
      }
  end

  # From:
  #   routes:
  #     route_id,agency_id,route_short_name,route_long_name,route_type,route_color,route_text_color
  #     SHUTTLE,CT,,SHUTTLE,3,,
  #     LOCAL,CT,LOCAL,,2,,
  #     LIMITED,CT,,LIMITED,2,,
  #     BABY BULLET,CT,,BABY BULLET,2,,
  #   trips:
  #     route_id,service_id,trip_id,trip_headsign,direction_id,block_id,shape_id,trip_short_name
  #     SHUTTLE,4951,RTD6320540,DIRIDON STATION,0,,,
  #     SHUTTLE,4951,RTD6320555,DIRIDON STATION,0,,,
  #   stop_times:
  #     trip_id,arrival_time,departure_time,stop_id,stop_sequence
  #     RTD6320540,07:33:00,07:33:00,777403,1
  #     RTD6320540,07:45:00,07:45:00,777402,2
  # To:
  #   trips:
  #     { route_id => { service_id => { trip_id => [[stop_id, arrival_time/departure_time(in seconds)]] } } }
  #     { "Bullet" => { "CT-14OCT-XXX" => { "650770-CT-14OCT-XXX" => [[70012, 29700], ...] } } }
  prepare_for("routes", "trips", "stop_times") do |routes, trips, stop_times|
    # { trip_id => [[stop_id, arrival_time/departure_time(in seconds)]] }
    times = stop_times
      .each { |item|
        # check data (if its scheme is changed)
        if item.arrival_time != item.departure_time
          require 'pry'; binding.pry
        end
      }
      .group_by(&:trip_id)
      .map { |trip_id, trips_values| # customized Hash#map
        trips_values
          .sort_by(&:stop_sequence)
          .map { |trip|
            t = trip.arrival_time.split(":").map(&:to_i)
            [trip.stop_id, t[0] * 60 * 60 + t[1] * 60 + t[2]]
          }
      }

    # { route_id => { service_id => { trip_id => ... } } }
    trips = trips
      .group_by(&:route_id)
      .map { |route_id, route_trips|
        route_trips
          .group_by(&:service_id)
          .map { |service_id, service_trips|
            service_trips
              .group_by(&:trip_id)
              .map { |trip_id, trip_trips|
                times[trip_id]
              }
          }
      }

    # { route_id => { service_id => ... } }
    routes = routes
      .select { |route| route.route_type == 2 } # 2 for Rail, 3 for bus
      .group_by(&:route_id)
      .map { |name, routes_values|
        routes_values
          .map(&:route_id)
          .inject({}) { |h, route_id|
            h.merge(trips[route_id])
          }
      }

    { routes: routes }
  end

  puts "Prepared Data."
end

desc "Enable Appcache."
task :enable_appcache do
  require 'tempfile'
  require 'fileutils'

  path = 'index.html'
  temp_file = Tempfile.new('index.html')
  begin
    File.open(path, 'r') do |file|
      file.each_line do |line|
        if line.match("<html>")
          temp_file.puts '<html manifest="rCaltrain.appcache">'
        else
          temp_file.puts line
        end
      end
    end
    temp_file.close
    FileUtils.mv(temp_file.path, path)
  ensure
    temp_file.close
    temp_file.unlink
  end

  puts "Enabled Appcache."
end

desc "Update Appcache."
task :update_appcache do
  require 'tempfile'
  require 'fileutils'

  path = 'rCaltrain.appcache'
  temp_file = Tempfile.new('rCaltrain.appcache')
  begin
    File.open(path, 'r') do |file|
      file.each_line do |line|
        if line.match(/# Updated at /)
          temp_file.puts "# Updated at #{Time.now}"
        else
          temp_file.puts line
        end
      end
    end
    temp_file.close
    FileUtils.mv(temp_file.path, path)
  ensure
    temp_file.close
    temp_file.unlink
  end

  puts "Updated Appcache."
end

desc "Minify Files."
task :minify_files do
  require 'tempfile'
  require 'fileutils'

  path = 'javascripts/default.js'
  temp_file = Tempfile.new('default.js')
  begin
    `uglifyjs #{path} -o #{temp_file.path} -c -m`
    FileUtils.mv(temp_file.path, path)
  ensure
    temp_file.close
    temp_file.unlink
  end

  path = 'stylesheets/default.css'
  temp_file = Tempfile.new('default.css')
  begin
    `uglifycss #{path} > #{temp_file.path}`
    FileUtils.mv(temp_file.path, path)
  ensure
    temp_file.close
    temp_file.unlink
  end

  puts "Minified files."
end

desc "Publish"
task :publish do
  def run(cmd)
    res = `#{cmd}`
    warn "#{cmd} failed:\n#{res}\n" unless $?.success?
    return $?.success?
  end

  begin
    # ensure working dir is clean
    run('[ -n "$(git status --porcelain)" ] && exit 1 || exit 0') &&

    # push master branch
    run("git checkout master") &&
    run("git push") &&

    # push gh-pages branch
    run("git checkout gh-pages") &&
    run("git checkout master -- .") &&
    [:prepare_data, :enable_appcache, :update_appcache, :minify_files].each do |task|
      Rake::Task[task].invoke
    end
    run("git add .") &&
    run("git commit -m 'Updated at #{Time.now}.'") &&
    run("git push") || abort
  ensure
    run("git checkout master")
  end
end
