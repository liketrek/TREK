# Compiles a source file of an extension into the App target too.
#
#   ruby ios/scripts/share-with-app.rb <extension-group> <file.swift>
#
# For types both sides need: the Live Activity's attributes are started by the
# app and drawn by the widget extension, so both must know them. Running it
# again changes nothing.
require 'xcodeproj'

group_name, file = ARGV
abort 'usage: share-with-app.rb <extension-group> <file.swift>' unless group_name && file

project = Xcodeproj::Project.open(File.expand_path('../App/App.xcodeproj', __dir__))
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
group = project.main_group[group_name] or abort "no group #{group_name}"
ref = group.files.find { |f| f.path == file } or abort "no #{file} in #{group_name}"

if app.source_build_phase.files_references.include?(ref)
  puts "#{file} is already in App"
else
  app.add_file_references([ref])
  project.save
  puts "#{file} now compiles into App too"
end
