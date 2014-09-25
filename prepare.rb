#!/usr/bin/env ruby

require "csv"

stops = CSV.read("gtfs/stops.txt").map! { |s| [s[0], s[2]]}
header = stops.shift
stops
  .reject! { |s| /Station/.match(s.last) }
  .map! { |s| s.last.gsub!(/ Caltrain/, ''); s }
stops.unshift(header)
CSV.open("stops.csv", "wb") { |c| stops.each { |i| c << i } }

times = CSV.read("gtfs/stop_times.txt").map! { |s| s[0..4]}
header = times.shift
times
  .select! { |s| /14OCT/.match(s[0]) }
  .map! { |s| id = s[0].split('-'); s[0] = [id[0], id[4]].join('-'); s }
times.unshift(header)
CSV.open("times.csv", "wb") { |c| times.each { |i| c << i } }

# update appcache
require 'tempfile'
require 'fileutils'

path = 'rCaltrain.appcache'
temp_file = Tempfile.new('foo')
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

# minify files
["fastclick", "jquery.cookie", "default"].each { |filename|
  `uglifyjs #{filename}.js -o #{filename}.min.js -c -m`
}
["default"].each do |filename|
  `uglifycss #{filename}.css > #{filename}.min.css`
end
