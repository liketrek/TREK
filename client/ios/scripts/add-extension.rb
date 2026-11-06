# Adds an app extension target to App.xcodeproj and embeds it in the app.
#
#   ruby ios/scripts/add-extension.rb <name> <bundle-id> <type> [extra frameworks...]
#
# type is "notification" (Notification Service Extension) or "widget" (WidgetKit,
# which also carries the Live Activities). The extension's sources live in
# ios/App/<name>/ with an Info.plist and <name>.entitlements next to them. The
# project file stays checked in, so the targets show in Xcode like any other;
# this script is how they got there, and running it again changes nothing.
require 'xcodeproj'

name, bundle_id, type, *frameworks = ARGV
abort 'usage: add-extension.rb <name> <bundle-id> <notification|widget> [frameworks...]' unless name && bundle_id && type

project_path = File.expand_path('../App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'

if project.targets.any? { |t| t.name == name }
  puts "#{name} is already in the project"
  exit 0
end

target = project.new_target(:app_extension, name, :ios, '15.0', nil, :swift)
# new_target links Foundation by a path into one SDK version; it is linked
# implicitly anyway, and a pinned SDK path breaks on the next Xcode.
target.frameworks_build_phase.files.select { |f| f.display_name.to_s.include?('Foundation') }.each do |f|
  ref = f.file_ref
  f.remove_from_project
  ref&.remove_from_project
end

group = project.main_group.find_subpath(name, true)
group.set_source_tree('<group>')
group.set_path(name)
sources = Dir.children(File.expand_path("../App/#{name}", __dir__)).sort
sources.each do |file|
  ref = group.new_reference(file)
  target.add_file_references([ref]) if file.end_with?('.swift')
end

frameworks.each do |framework|
  ref = project.frameworks_group.new_file("System/Library/Frameworks/#{framework}.framework", :sdk_root)
  target.frameworks_build_phase.add_file_reference(ref, true)
end

app_settings = app.build_configurations.first.build_settings
target.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = "#{name}/Info.plist"
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = "#{name}/#{name}.entitlements"
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['DEVELOPMENT_TEAM'] = app_settings['DEVELOPMENT_TEAM'] if app_settings['DEVELOPMENT_TEAM']
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = type == 'widget' ? '16.2' : '15.0'
  s['MARKETING_VERSION'] = app_settings['MARKETING_VERSION'] || '1.0'
  s['CURRENT_PROJECT_VERSION'] = app_settings['CURRENT_PROJECT_VERSION'] || '1'
  s['SKIP_INSTALL'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
end

embed = app.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' } ||
        app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
build_file = embed.add_file_reference(target.product_reference, true)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
app.add_dependency(target)

project.save
puts "added #{name} (#{bundle_id})"
